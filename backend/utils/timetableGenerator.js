import { Timetable, Class, Teacher, Subject } from '../models/index.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MAX_PERIODS = 7;
const MAX_ITERATIONS = 500000;
const TEACHER_DAILY_LIMIT = 6;

/**
 * Smart Timetable Generator Engine
 */
export class TimetableGenerator {
    constructor() {
        this.iterations = 0;
        this.failReason = "";
    }

    /**
     * Core Algorithm: Generates a conflict-free timetable
     * @param {Object} options { mode: 'full' | 'partial' | 'incremental', classId: string }
     */
    async generate(options = { mode: 'full' }) {
        this.iterations = 0;
        this.failReason = "";

        // 1. Fetch all required data
        const allClasses = await Class.find().populate('subjects');
        const allTeachers = await Teacher.find({ isActive: true });
        const allSubjects = await Subject.find().populate('teacher');

        console.log(`[TimetableGenerator] Found ${allClasses.length} classes, ${allTeachers.length} teachers, ${allSubjects.length} subjects.`);
        allClasses.forEach(c => {
            console.log(`[TimetableGenerator] Class: ${c.name}, Subjects Count: ${c.subjects?.length || 0}`);
            if (c.subjects?.length > 0) {
                console.log(`[TimetableGenerator] First Subject for ${c.name}: ${JSON.stringify(c.subjects[0])}`);
            }
        });

        // 2. Prepare state maps
        // teacherBusy[teacherId][day][period] = true/false
        const teacherBusy = {};
        allTeachers.forEach(t => { teacherBusy[t._id.toString()] = {}; });

        // currentTimetable[classId][day][period] = { subject, teacher }
        const timetableState = {};
        allClasses.forEach(c => { timetableState[c._id.toString()] = {}; });

        // Load existing timetable if not in 'full' mode
        if (options.mode !== 'full') {
            const existing = await Timetable.find();
            existing.forEach(entry => {
                const cId = entry.classId.toString();
                const day = entry.day;
                if (!timetableState[cId]) timetableState[cId] = {};
                timetableState[cId][day] = entry.periods || [];
                
                // Mark teachers as busy
                (entry.periods || []).forEach((p, idx) => {
                    if (p && p.teacher) {
                        const tId = p.teacher.toString();
                        if (teacherBusy[tId]) {
                            if (!teacherBusy[tId][day]) teacherBusy[tId][day] = {};
                            teacherBusy[tId][day][idx] = true;
                        }
                    }
                });
            });
        }

        // 3. Define target classes to process
        const targetClasses = (options.classId 
            ? allClasses.filter(c => c._id.toString() === options.classId)
            : allClasses).filter(c => c.subjects?.length > 0);

        if (targetClasses.length === 0) {
            console.warn("[TimetableGenerator] No classes with subjects found to process.");
            return { status: 'failed', reason: "No target classes have subjects assigned." };
        }

        // 4. Start Generation
        try {
            // trackWeeklyFrequency[classId][subjectName] = count
            const weeklyFrequency = {};
            allClasses.forEach(c => { weeklyFrequency[c._id.toString()] = {}; });

            const result = await this._backtrack(targetClasses, 0, 0, 0, timetableState, teacherBusy, options.mode, weeklyFrequency);
            if (!result) {
                return { 
                    status: 'failed', 
                    reason: this.failReason || "Could not find a valid configuration within constraints.",
                    suggestion: "Try assigning more teachers to subjects or increasing workload limits."
                };
            }
            return { status: 'success', data: timetableState };
        } catch (error) {
            return { status: 'failed', reason: error.message };
        }
    }

    /**
     * Recursive backtracking with constraints
     */
    async _backtrack(classes, classIdx, dayIdx, periodIdx, state, busy, mode, freq) {
        this.iterations++;
        if (this.iterations > MAX_ITERATIONS) {
            this.failReason = "Algorithm reached maximum iteration limit (Infinite loop protection).";
            return false;
        }

        // Base case: All classes processed
        if (classIdx >= classes.length) return true;

        const currentClass = classes[classIdx];
        const cId = currentClass._id.toString();
        const day = DAYS[dayIdx];

        // Move to next day
        if (dayIdx >= DAYS.length) {
            return await this._backtrack(classes, classIdx + 1, 0, 0, state, busy, mode, freq);
        }

        // Move to next period
        if (periodIdx >= MAX_PERIODS) {
            return await this._backtrack(classes, classIdx, dayIdx + 1, 0, state, busy, mode, freq);
        }

        // Skip if slot is already filled and we are in incremental/partial mode
        if (mode !== 'full' && state[cId][day] && state[cId][day][periodIdx]) {
            return await this._backtrack(classes, classIdx, dayIdx, periodIdx + 1, state, busy, mode, freq);
        }

        // Logic for picking a subject
        const classSubjects = currentClass.subjects || [];
        if (!classSubjects.length) {
            this.failReason = `Class ${currentClass.name} has no subjects assigned.`;
            return false;
        }

        // RANDOMIZED HEURISTIC: Shuffle subjects within priority groups
        // This ensures days are different!
        const core = classSubjects.filter(s => s.name.toLowerCase().includes('math') || s.name.toLowerCase().includes('sci'));
        const nonCore = classSubjects.filter(s => !core.includes(s));

        // Shuffle utility
        const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

        let candidates;
        if (periodIdx < 3) {
            candidates = [...shuffle(core), ...shuffle(nonCore)];
        } else {
            candidates = [...shuffle(nonCore), ...shuffle(core)];
        }

        for (const subject of candidates) {
            const sName = subject.name;
            const teacherId = subject.teacher?._id?.toString() || subject.teacher?.toString();
            if (!teacherId) {
                this.failReason = `Subject ${sName} in Class ${currentClass.name} has no assigned teacher.`;
                continue;
            }

            // --- CONSTRAINT CHECKS ---
            
            // 1. Teacher Overlap Check (Zero Conflict)
            if (busy[teacherId]?.[day]?.[periodIdx]) continue;

            // 2. Teacher Daily Workload Check (Max 6)
            const dailyWorkload = Object.values(busy[teacherId]?.[day] || {}).filter(v => v === true).length;
            if (dailyWorkload >= TEACHER_DAILY_LIMIT) continue;

            // 3. Avoid Same Subject Repetition (Back-to-back)
            if (periodIdx > 0 && state[cId][day]?.[periodIdx - 1]?.subject === sName) continue;

            // 4. Subject Diversity Check (Max 2 of same subject per day)
            const dailyFreq = (state[cId][day] || []).filter(p => p?.subject === sName).length;
            if (dailyFreq >= 2) continue;

            // 5. Subject Weekly Frequency (Optional limit if needed)
            // if ((freq[cId][sName] || 0) >= 6) continue;

            // --- ASSIGN ---
            if (!state[cId][day]) state[cId][day] = new Array(MAX_PERIODS).fill(null);
            
            state[cId][day][periodIdx] = {
                subject: sName,
                teacher: teacherId,
                teacherName: subject.teacher?.name || 'Assigned Teacher',
                room: currentClass.room || subject.room || 'TBD'
            };

            if (!busy[teacherId][day]) busy[teacherId][day] = {};
            busy[teacherId][day][periodIdx] = true;
            freq[cId][sName] = (freq[cId][sName] || 0) + 1;

            // Recurse
            if (await this._backtrack(classes, classIdx, dayIdx, periodIdx + 1, state, busy, mode, freq)) return true;

            // --- BACKTRACK ---
            state[cId][day][periodIdx] = null;
            busy[teacherId][day][periodIdx] = false;
            freq[cId][sName]--;
        }

        return false; // No valid assignment found for this slot
    }
}

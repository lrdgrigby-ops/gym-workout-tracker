
const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "workouts.json");

app.use(express.json({ limit: "10kb" }));

// Read stored workouts
async function readWorkouts() {
    try {
        const data = await fs.readFile(DATA_FILE, "utf8");
        const workouts = JSON.parse(data);

        if (!Array.isArray(workouts)) {
            throw new Error("Invalid workout data");
        }

        return workouts;
    } catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }

        throw error;
    }
}

// Write workouts to a JSON file
async function writeWorkouts(workouts) {
    const tempFile = DATA_FILE + ".tmp";

    await fs.writeFile(
        tempFile,
        JSON.stringify(workouts, null, 2),
        "utf8"
    );

    await fs.rename(tempFile, DATA_FILE);
}

// Keep write operations in sequence
let writeQueue = Promise.resolve();

function queueUpdate(updateFunction) {
    const operation = writeQueue.then(async () => {
        const workouts = await readWorkouts();
        const result = updateFunction(workouts);

        if (result.changed) {
            await writeWorkouts(workouts);
        }

        return result;
    });

    writeQueue = operation.then(
        () => undefined,
        () => undefined
    );

    return operation;
}

// GET: Retrieve workout records
app.get("/api/workouts", async (req, res) => {
    try {
        await writeQueue;
        const workouts = await readWorkouts();
        res.json(workouts);
    } catch (error) {
        res.status(500).json({
            error: "Unable to load workouts"
        });
    }
});

// POST: Save a workout
app.post("/api/workouts", async (req, res) => {
    const { date, exercise, sets, reps, weight } = req.body || {};

    const validDate =
        typeof date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        !Number.isNaN(Date.parse(date)) &&
        new Date(date).toISOString().slice(0, 10) === date;

    const validExercise =
        typeof exercise === "string" &&
        exercise.trim().length > 0 &&
        exercise.trim().length <= 80;

    const validNumbers =
        Number.isSafeInteger(sets) &&
        sets >= 1 &&
        Number.isSafeInteger(reps) &&
        reps >= 1 &&
        typeof weight === "number" &&
        Number.isFinite(weight) &&
        weight >= 0;

    if (!validDate || !validExercise || !validNumbers) {
        return res.status(400).json({
            error: "Invalid workout details"
        });
    }

    const workout = {
        id: crypto.randomUUID(),
        date,
        exercise: exercise.trim(),
        sets,
        reps,
        weight
    };

    try {
        await queueUpdate(workouts => {
            workouts.push(workout);
            return { changed: true };
        });

        res.status(201).json(workout);
    } catch (error) {
        res.status(500).json({
            error: "Unable to save workout"
        });
    }
});

// DELETE: Remove a workout
app.delete("/api/workouts/:id", async (req, res) => {
    try {
        const result = await queueUpdate(workouts => {
            const index = workouts.findIndex(
                workout => workout.id === req.params.id
            );

            if (index === -1) {
                return { changed: false, found: false };
            }

            workouts.splice(index, 1);
            return { changed: true, found: true };
        });

        if (!result.found) {
            return res.status(404).json({
                error: "Workout not found"
            });
        }

        res.json({ message: "Workout deleted" });
    } catch (error) {
        res.status(500).json({
            error: "Unable to delete workout"
        });
    }
});

// Serve the frontend files
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(
        `Gym Workout Tracker running at http://localhost:${PORT}`
    );
});

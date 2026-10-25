
const form = document.querySelector("#workout-form");
const tableBody = document.querySelector("#workout-list");
const message = document.querySelector("#message");
const addButton = document.querySelector("#add-button");

function showMessage(text, type = "success") {
    message.textContent = text;
    message.className = type;
}

function updateDashboard(workouts) {
    document.querySelector("#total-workouts").textContent =
        workouts.length;

    const exercises = new Set(
        workouts.map(w => w.exercise.trim().toLowerCase())
    );

    const days = new Set(workouts.map(w => w.date));

    document.querySelector("#total-exercises").textContent =
        exercises.size;

    document.querySelector("#workout-days").textContent =
        days.size;
}

function createCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
}

function displayWorkouts(workouts) {
    tableBody.replaceChildren();

    if (workouts.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.textContent = "No workouts recorded yet.";
        row.appendChild(cell);
        tableBody.appendChild(row);
    }

    workouts.forEach(workout => {
        const row = document.createElement("tr");

        createCell(row, workout.date);
        createCell(row, workout.exercise);
        createCell(row, workout.sets);
        createCell(row, workout.reps);
        createCell(row, `${workout.weight} kg`);

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.dataset.id = workout.id;

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);
        tableBody.appendChild(row);
    });

    updateDashboard(workouts);
}

async function loadWorkouts() {
    try {
        const response = await fetch("/api/workouts");

        if (!response.ok) {
            throw new Error("Unable to load workouts.");
        }

        const workouts = await response.json();
        displayWorkouts(workouts);
    } catch (error) {
        showMessage(
            "Could not load workouts. Check the server.",
            "error"
        );
    }
}

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const workout = {
        date: document.querySelector("#date").value,
        exercise: document.querySelector("#exercise").value.trim(),
        sets: Number(document.querySelector("#sets").value),
        reps: Number(document.querySelector("#reps").value),
        weight: Number(document.querySelector("#weight").value)
    };

    if (
        !workout.date ||
        !workout.exercise ||
        !Number.isInteger(workout.sets) ||
        workout.sets < 1 ||
        !Number.isInteger(workout.reps) ||
        workout.reps < 1 ||
        !Number.isFinite(workout.weight) ||
        workout.weight < 0
    ) {
        showMessage("Please enter valid workout details.", "error");
        return;
    }

    addButton.disabled = true;
    addButton.textContent = "Saving...";

    try {
        const response = await fetch("/api/workouts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(workout)
        });

        if (!response.ok) {
            throw new Error("Failed to save workout.");
        }

        form.reset();
        showMessage("Workout saved successfully!");
        await loadWorkouts();
    } catch (error) {
        showMessage(
            "Could not save workout. Please try again.",
            "error"
        );
    } finally {
        addButton.disabled = false;
        addButton.textContent = "Add Workout";
    }
});

tableBody.addEventListener("click", async function (event) {
    const button = event.target.closest(".delete-btn");

    if (!button) return;

    if (!confirm("Delete this workout?")) return;

    button.disabled = true;

    try {
        const response = await fetch(
            `/api/workouts/${encodeURIComponent(button.dataset.id)}`,
            { method: "DELETE" }
        );

        if (!response.ok) {
            throw new Error("Failed to delete workout.");
        }

        showMessage("Workout deleted successfully!");
        await loadWorkouts();
    } catch (error) {
        button.disabled = false;
        showMessage(
            "Could not delete workout. Please try again.",
            "error"
        );
    }
});

loadWorkouts();

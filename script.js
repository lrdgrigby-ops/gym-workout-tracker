const form = document.querySelector("form");
const tableBody = document.querySelector("tbody");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const date = document.querySelector("#date").value;
    const exercise = document.querySelector("#exercise").value;
    const sets = document.querySelector("#sets").value;
    const reps = document.querySelector("#reps").value;
    const weight = document.querySelector("#weight").value;

    if (!date || !exercise || !sets || !reps || !weight) {
        alert("Please complete all workout fields.");
        return;
    }

    const newRow = document.createElement("tr");

   newRow.innerHTML = `
    <td>${date}</td>
    <td>${exercise}</td>
    <td>${sets}</td>
    <td>${reps}</td>
    <td>${weight} kg</td>
    <td><button class="delete-btn">Delete</button></td>
`;

    tableBody.appendChild(newRow);

    form.reset();
});
tableBody.addEventListener("click", function (event) {
    if (event.target.classList.contains("delete-btn")) {
        event.target.closest("tr").remove();
    }
});
tableBody.appendChild(newRow);

form.reset();


tableBody.addEventListener("click", function (event) {
    if (event.target.classList.contains("delete-btn")) {
        event.target.closest("tr").remove();
    }
});

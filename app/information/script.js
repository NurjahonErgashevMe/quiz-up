const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const { gsap } = require("gsap");
const xlsx = require("xlsx");
const { alert } = require("../components/alert");

document.getElementById("view-results").addEventListener("click", async () => {
  const grade = document.getElementById("grade").value;
  const subject = document.getElementById("subject").value;

  if (!grade || !subject) {
    alert.show("Пожалуйста, выберите класс и предмет", "error");
    return;
  }

  const userDataPath = await ipcRenderer.invoke("get-user-data-path");
  const targetPath = path.join(
    userDataPath,
    "result",
    grade,
    `${subject}.json`
  );

  if (!fs.existsSync(targetPath)) {
    alert.show("Нет данных для выбранного класса и предмета", "error");
    return;
  }

  const fileContent = fs.readFileSync(targetPath, "utf8");
  const results = JSON.parse(fileContent).result;

  const resultsBody = document.getElementById("results-body");
  resultsBody.innerHTML = "";

  results.forEach((result) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = result.name;
    row.appendChild(nameCell);

    const lastnameCell = document.createElement("td");
    lastnameCell.textContent = result.lastname;
    row.appendChild(lastnameCell);

    const correctAnswersCell = document.createElement("td");
    correctAnswersCell.textContent = result.correctAnswers;
    row.appendChild(correctAnswersCell);

    const totalQuestionsCell = document.createElement("td");
    totalQuestionsCell.textContent = result.totalQuestions;
    row.appendChild(totalQuestionsCell);

    const percentageCell = document.createElement("td");
    percentageCell.textContent = `${result.completionPercentage}%`;
    row.appendChild(percentageCell);

    const solvedQuestionsCell = document.createElement("td");
    solvedQuestionsCell.textContent = result.solvedQuestions.join(", ");
    row.appendChild(solvedQuestionsCell);

    const finishedAtDayCell = document.createElement("td");
    finishedAtDayCell.textContent = result.finishedAt.day;
    row.appendChild(finishedAtDayCell);

    const finishedAtTimeCell = document.createElement("td");
    finishedAtTimeCell.textContent = result.finishedAt.time;
    row.appendChild(finishedAtTimeCell);

    resultsBody.appendChild(row);
  });

  const { toggleOpenAttr } = openAttr();

  gsap.to("#information-form", {
    duration: 0.3,
    opacity: 0,
    ease: "power2.out",
    onComplete: () => {
      document.getElementById("information-form").style.display = "none";
      document.getElementById("results-section").style.display = "block";
      gsap.fromTo(
        "#results-section",
        { opacity: 0 },
        { duration: 0.3, opacity: 1, ease: "power2.in" }
      );
      toggleOpenAttr();
    },
  });
});

document.getElementById("back-button").addEventListener("click", () => {
  const { toggleOpenAttr, currentOpened } = openAttr();

  console.log(currentOpened, "attr");

  if (currentOpened === "form") {
    ipcRenderer.send("navigate", "home");
  } else {
    gsap.to("#results-section", {
      duration: 0.3,
      opacity: 0,
      ease: "power2.out",
      onComplete: () => {
        document.getElementById("results-section").style.display = "none";
        document.getElementById("information-form").style.display = "block";
        gsap.fromTo(
          "#information-form",
          { opacity: 0 },
          { duration: 0.3, opacity: 1, ease: "power2.in" }
        );
        toggleOpenAttr();
      },
    });
  }
});

document
  .getElementById("download-excel")
  .addEventListener("click", async () => {
    const grade = document.getElementById("grade").value;
    const subject = document.getElementById("subject").value;

    const userDataPath = await ipcRenderer.invoke("get-user-data-path");
    const targetPath = path.join(
      userDataPath,
      "result",
      grade,
      `${subject}.json`
    );

    if (!fs.existsSync(targetPath)) {
      alert.show("Нет данных для выбранного класса и предмета", "error");
      return;
    }

    try {
      const fileContent = fs.readFileSync(targetPath, "utf8");
      const results = JSON.parse(fileContent).result;

      const worksheetData = results.map((result) => ({
        Ism: result.name,
        Familiya: result.lastname,
        "Jami Savollar": result.totalQuestions,
        "Tog'ri Javoblar": result.correctAnswers,
        "Tog'ri Javoblar (%)": `${result.completionPercentage}%`,
        "Tog'ri bajarilgan savollar": result.solvedQuestions.join(", "),
        "Bajarilgan kun": result.finishedAt.day,
        "Bajarilgan vaqt": result.finishedAt.time,
      }));

      const worksheet = xlsx.utils.json_to_sheet(worksheetData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Results");

      // Стилизация заголовков
      // const headerStyle = {
      //   fill: { fgColor: { rgb: "5d7de9" } },
      //   font: { color: { rgb: "FFFFFF" }, bold: true },
      //   alignment: { horizontal: "center", vertical: "center" },
      // };
      // const cellsToStyle = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"];
      // cellsToStyle.forEach((cell) => {
      //   if (!worksheet[cell]) worksheet[cell] = {}; // Инициализируем ячейку, если она еще не существует
      //   worksheet[cell].s = headerStyle; // Применяем стили
      // });

      // Установка ширины ячеек
      const wscols = [
        { wpx: 100 },
        { wpx: 100 },
        { wpx: 100 },
        { wpx: 100 },
        { wpx: 100 },
        { wpx: 100 },
        { wpx: 100 },
        { wpx: 100 },
      ];
      worksheet["!cols"] = wscols;

      // Открываем диалог сохранения файла
      const { filePath } = await ipcRenderer.invoke("show-save-dialog", {
        title: "Сохранить файл",
        defaultPath: `${grade}_${subject}.xlsx`,
        filters: [
          { name: "Excel Files", extensions: ["xlsx"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (filePath) {
        xlsx.writeFile(workbook, filePath);
        alert.show(`Файл сохранен по пути: ${filePath}`, "success");
      } else {
        alert.show("Сохранение файла отменено", "info");
      }
    } catch (err) {
      console.log("Ошибка при сохранении информации", err);
      alert.show(`Ошибка при сохранении информации : ${err}`, "error");
    }
  });

document.getElementById('results-button').addEventListener('click', () => {
    ipcRenderer.send('navigate', 'results');
});

document.getElementById('upload-button').addEventListener('click', () => {
    ipcRenderer.send('navigate', 'upload');
});

document.getElementById('back-button').addEventListener('click', () => {
    ipcRenderer.send('navigate', 'admin');
});

function openAttr() {
  const informationContainer = document.querySelector(".information-container");
  const currentOpened = informationContainer.getAttribute("opened");
  const newOpened = currentOpened === "form" ? "information" : "form";
  const toggleOpenAttr = () =>
    informationContainer.setAttribute("opened", newOpened);

  return { toggleOpenAttr, newOpened, currentOpened };
}

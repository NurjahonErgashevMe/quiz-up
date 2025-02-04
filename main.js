const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      // enableRemoteModule: false, //
      // preload: path.join(__dirname, 'preload.js'), // Укажите путь к preload.js
      contextIsolation: false, // Включите контекстную изоляцию
    },
  });

  // Указываем абсолютный путь к index.html
  const indexPath = path.join(__dirname, "app", "index.html");
  mainWindow.loadFile(indexPath);

  const cssPath = path.join(__dirname, "app", "styles.css");
  const css = fs.readFileSync(cssPath, "utf8");

  // Применение CSS
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.insertCSS(css);
  });

  mainWindow.webContents.openDevTools();
}

// Navigation handling
ipcMain.on("navigate", (event, page) => {
  const basePath = path.join(__dirname, "app");
  let filePath;

  switch (page) {
    case "home":
      filePath = path.join(basePath, "index.html");
      break;
    case "admin":
      filePath = path.join(basePath, "admin", "index.html");
      break;
    case "upload":
      filePath = path.join(basePath, "upload", "quiz", "index.html");
      break;
    case "quiz":
      filePath = path.join(basePath, "quiz", "index.html");
      break;
    case "upload_students":
      filePath = path.join(basePath, "upload", "students", "index.html");
      break;
    case "information":
      filePath = path.join(basePath, "information", "index.html");
      break;
  }

  if (filePath) {
    mainWindow.loadFile(filePath);
  }
});

ipcMain.handle("save-file", async (event, { grade, subject, fileBuffer }) => {
  console.log({ grade, subject, fileBuffer });
  try {
    const targetDir = path.join(app.getPath("userData"), "assets", grade);

    // Убедитесь, что директория создается, если её нет
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Путь к файлу
    const targetPath = path.join(targetDir, `${subject}.xlsx`);

    // Сохраняем файл
    fs.writeFileSync(targetPath, Buffer.from(fileBuffer));

    return { success: true, targetPath }; // Возвращаем строку пути
  } catch (error) {
    console.error("Ошибка сохранения файла:", error);
    return { success: false, error: error.message }; // В случае ошибки возвращаем строку с ошибкой
  }
});

ipcMain.handle(
  "save-quiz-results",
  async (event, { grade, subject, result }) => {
    try {
      const targetDir = path.join(app.getPath("userData"), "result", grade);

      // Убедитесь, что директория создается, если её нет
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Путь к файлу
      const targetPath = path.join(targetDir, `${subject}.json`);

      let existingData = { result: [] };

      // Если файл существует, читаем его содержимое
      if (fs.existsSync(targetPath)) {
        const fileContent = fs.readFileSync(targetPath, "utf8");
        existingData = JSON.parse(fileContent);
      }

      // Добавляем новый результат
      existingData.result.push(result);

      // Сохраняем файл
      fs.writeFileSync(targetPath, JSON.stringify(existingData, null, 2));

      return { success: true, targetPath };
    } catch (error) {
      console.error("Ошибка сохранения результатов теста:", error);
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle("get-user-data-path", () => {
  return app.getPath("userData"); // Возвращаем путь
});

ipcMain.handle("show-save-dialog", async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

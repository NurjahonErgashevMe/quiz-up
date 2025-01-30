// const { ipcRenderer } = require('electron');
// const fs = require('fs');
// const path = require('path');
// const XLSX = require('xlsx');

// document.getElementById('uploadForm').addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const fileInput = document.getElementById('excelFile');
//     const classSelect = document.getElementById('classSelect');
//     const subjectSelect = document.getElementById('subjectSelect');

//     if (!fileInput.files.length) {
//         showMessage('Iltimos, faylni tanlang', 'error');
//         return;
//     }

//     if (!classSelect.value) {
//         showMessage('Iltimos, sinfni tanlang', 'error');
//         return;
//     }

//     if (!subjectSelect.value) {
//         showMessage('Iltimos, fanni tanlang', 'error');
//         return;
//     }

//     const file = fileInput.files[0];

//     // Check if file is Excel
//     if (!file.name.match(/\.(xlsx|xls)$/i)) {
//         showMessage('Iltimos, Excel faylini tanlang', 'error');
//         return;
//     }

//     try {
//         // Create dynamic path to assets directory
//         const assetsDir = path.join(__dirname, '..', 'assets');
//         const classDir = path.join(assetsDir, classSelect.value);

//         // Create directories if they don't exist
//         if (!fs.existsSync(assetsDir)) {
//             fs.mkdirSync(assetsDir, { recursive: true });
//         }
//         if (!fs.existsSync(classDir)) {
//             fs.mkdirSync(classDir, { recursive: true });
//         }

//         // Define target path with class and subject
//         const targetPath = path.join(classDir, `${subjectSelect.value}.xlsx`);

//         // Read the file content
//         const fileBuffer = await readFileAsBuffer(file);

//         // Write the file to the target location
//         fs.writeFileSync(targetPath, fileBuffer);

//         showMessage('Fayl muvaffaqiyatli yuklandi!', 'success');
//         document.getElementById('uploadForm').reset();
//     } catch (error) {
//         console.error('Error saving file:', error);
//         showMessage('Faylni saqlashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.', 'error');
//     }
// });

// // Helper function to read file as buffer
// function readFileAsBuffer(file) {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = () => resolve(Buffer.from(reader.result));
//         reader.onerror = reject;
//         reader.readAsArrayBuffer(file);
//     });
// }

// function showMessage(text, type) {
//     const messageDiv = document.getElementById('message');
//     messageDiv.textContent = text;
//     messageDiv.className = `message ${type}`;
//     messageDiv.style.display = 'block';

//     setTimeout(() => {
//         messageDiv.style.display = 'none';
//     }, 5000);
// }

// document.getElementById('back-button').addEventListener('click', () => {
//     ipcRenderer.send('navigate', 'home');
// });



const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const grade = document.getElementById('grade').value;
    const subject = document.getElementById('subject').value;
    const fileInput = document.getElementById('excelFile');

    if (!grade || !subject || !fileInput.files[0]) {
        showError('Barcha maydonlarni to\'ldiring');
        return;
    }


    try {
        const fileBuffer = await readFileAsBuffer(fileInput.files[0]);

        // console.log({ grade, subject, fileBuffer })
        // Отправляем данные в main-процесс для сохранения файла
        const result = await ipcRenderer.invoke('save-file', {
            grade,
            subject,
            fileBuffer,
        });

        if (result.success) {
            showSuccess(`Файл сохранен: ${result.targetPath}`);
        } else {
            throw new Error(result.error);
        }

        document.getElementById('uploadForm').reset();
    } catch (error) {
        console.error('Ошибка сохранения файла:', error);
        showError('Faylni yuklashda xatolik yuz berdi');
    }
});

function readFileAsBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(Buffer.from(reader.result));
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function showSuccess(message) {
    const successMessage = document.getElementById('message');
    successMessage.classList.add('success');
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

function showError(message) {
    const errorMessage = document.getElementById('message');
    errorMessage.classList.add('error');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

document.getElementById('back-button').addEventListener('click', () => {
    ipcRenderer.send('navigate', 'home');
});


// Function to download template
function downloadExcelTemplate() {
    try {
        const templatePath = path.join(__dirname, '..', 'assets', 'demo.xlsx');

        // Read the file
        const fileContent = fs.readFileSync(templatePath);

        // Convert to Blob
        const blob = new Blob([fileContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'demo.xlsx';

        // Trigger download
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading template:', error);
        showError('Ошибка при скачивании шаблона');
    }
}

// Add event listener for template download
document.getElementById('downloadTemplate').addEventListener('click', downloadExcelTemplate);

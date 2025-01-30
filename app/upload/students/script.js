const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

const { alert } = require('../../components/alert');

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('excelFile');
    const gradeSelect = document.getElementById('grade');

    if (!fileInput.files.length) {
        alert.show('Iltimos, faylni tanlang', "error");
        return;
    }

    if (!gradeSelect.value) {
        alert.show('Iltimos, sinfni tanlang', "error");
        return;
    }

    const file = fileInput.files[0];


    // Check if file is Excel
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert.show('Iltimos, Excel faylini tanlang', 'error');
        return;
    }

    try {
        // Read the file content
        const fileBuffer = await readFileAsBuffer(file);

        const result = await ipcRenderer.invoke('save-file', {
            grade: gradeSelect.value,
            subject: 'students',
            fileBuffer,
        });
        if (result.success) {
            alert.show(`Файл сохранен: ${result.targetPath}`);
        } else {
            throw new Error(result.error);
        }

        document.getElementById('uploadForm').reset();
    } catch (error) {
        console.error('Ошибка сохранения файла:', error);
        alert.show('Файл сохранить не удалось: ' + error.message, 'error');
    }
});

document.getElementById('back-button').addEventListener('click', () => {
    ipcRenderer.send('navigate', 'home');
});


document.getElementById('quiz-upload-button').addEventListener('click', () => {
    ipcRenderer.send('navigate', 'upload');
});

function readFileAsBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(Buffer.from(reader.result));
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}


// Function to download template
function downloadExcelTemplate() {
    try {
        const templatePath = path.join(__dirname, '..', '..', 'assets', 'demo-students.xlsx');

        // Read the file
        const fileContent = fs.readFileSync(templatePath);

        // Convert to Blob
        const blob = new Blob([fileContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'demo-students.xlsx';

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

document.getElementById('downloadTemplate').addEventListener('click', downloadExcelTemplate);

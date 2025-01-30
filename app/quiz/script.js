const { ipcRenderer, app } = require('electron');
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const { alert } = require('../components/alert');

let currentQuestions = [];
let currentQuestionIndex = 0;
let timer;
let studentFullName = '';
let studentGrade = '';
let studentSubject = '';
let totalTimeLeft;
let quizData;
let selectedAnswers = [];

// Event listener for the start quiz button
document.getElementById('start-quiz').addEventListener('click', () => {
    const studentSearch = document.getElementById('student-search');
    const gradeInput = document.getElementById('grade');
    const subjectInput = document.getElementById('subject');

    console.log(studentSearch.value)

    if (!studentSearch.value.trim() || !gradeInput.value || !subjectInput.value) {
        alert.show('Пожалуйста, заполните все поля', "error");
        return;
    }

    studentFullName = studentSearch.value.trim();
    studentGrade = gradeInput.value;
    studentSubject = subjectInput.value;

    initializeQuiz();
});

document.querySelectorAll('.back-button').forEach(button => {
    button.addEventListener('click', () => {
        ipcRenderer.send('navigate', 'home');
    });
});

document.getElementById('restart-button').addEventListener('click', () => {
    location.reload();
});

// Функция для чтения Excel файла
function readQuizTableFromExcel(filePath) {
    console.log('Trying to read file from:', filePath);
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const questionsData = xlsx.utils.sheet_to_json(worksheet);
    console.log('Questions data loaded:', questionsData);

    return {
        questions: questionsData.filter(row => row["savol"] && row["variantlar"] && row["tog'ri javob"]).map((row, index) => ({
            id: index + 1,
            question: row["savol"],
            options: row["variantlar"] ? row["variantlar"].split(",").map(opt => opt.trim()) : [],
            correctIndex: parseInt(row["tog'ri javob"], 10)
        })),
        totalTimeLimit: questionsData[0]["umumiy vaqt"] ? parseInt(questionsData[0]["umumiy vaqt"], 10) * 60 : 3600
    };
}

// Инициализация викторины
async function initializeQuiz() {
    try {
        // Reset selectedAnswers when starting a new quiz
        selectedAnswers = [];

        const userDataPath = await ipcRenderer.invoke('get-user-data-path');
        const targetDir = path.join(userDataPath, 'assets', studentGrade, `${studentSubject}.xlsx`);
        quizData = readQuizTableFromExcel(targetDir);
        currentQuestions = quizData.questions
        totalTimeLeft = quizData.totalTimeLimit;
        console.log(quizData, 'quizData')

        if (currentQuestions && currentQuestions.length > 0) {
            document.getElementById('total-questions').textContent = currentQuestions.length;
            document.getElementById('student-form').style.display = 'none';
            document.getElementById('quiz-section').style.display = 'block';
            showQuestion();
            startTimer(totalTimeLeft);
        } else {
            throw new Error('No questions loaded from Excel file');
        }
    } catch (error) {
        console.error('Ошибка при чтении файла:', error);
        alert.show('Ошибка при загрузке вопросов. Проверьте формат файла Excel.\n\nДетали ошибки: ' + error.message, "error");
    }
}

function showQuestion() {
    console.log('Current question index:', currentQuestionIndex);
    console.log('Current question object:', currentQuestions[currentQuestionIndex]);
    const questionObj = currentQuestions[currentQuestionIndex];
    document.getElementById('question').textContent = questionObj.question;
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';

    questionObj.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.className = 'option';
        button.onclick = () => selectOption(index);
        optionsContainer.appendChild(button);
    });

    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('total-questions').textContent = currentQuestions.length;

    // Disable the next button when showing a new question
    const nextButton = document.getElementById('next-btn');
    nextButton.disabled = true;

    // If a previous answer was selected, highlight it
    if (selectedAnswers[currentQuestionIndex] !== undefined) {
        const options = document.querySelectorAll('.option');
        options[selectedAnswers[currentQuestionIndex]].classList.add('selected');
        document.getElementById('next-btn').disabled = false;
    }
}

function selectOption(index) {
    const options = document.querySelectorAll('.option');
    options.forEach((option, idx) => {
        option.classList.remove('selected');
        if (idx === index) {
            option.classList.add('selected');
        }
    });


    // Store the selected answer for the current question
    selectedAnswers[currentQuestionIndex] = index;

    console.log(selectedAnswers, 'selectedAnswers')
    // Enable the next button when an option is selected
    document.getElementById('next-btn').disabled = false;
}

// Функция запуска таймера
function startTimer(timeLimit) {
    clearInterval(timer);
    totalTimeLeft = timeLimit;

    const timerDisplay = document.getElementById('timer');

    // Сразу вставляем время
    const minutes = Math.floor(totalTimeLeft / 60);
    const seconds = totalTimeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    timer = setInterval(() => {
        totalTimeLeft--;

        // Конвертируем секунды в формат MM:SS
        const minutes = Math.floor(totalTimeLeft / 60);
        const seconds = totalTimeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (totalTimeLeft <= 0) {
            clearInterval(timer);
            showResult();
        }
    }, 1000);
}

document.getElementById('next-btn').addEventListener('click', nextQuestion);

function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex < currentQuestions.length) {
        showQuestion();
    } else {
        showResult();
    }
}

// Add back button event listener
document.getElementById('back-btn').addEventListener('click', backQuestion);

function backQuestion() {
    // Only allow going back if not on the first question
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
}

// async function saveQuizResults(fullName, percentage) {
//     try {
//         // Split full name into first and last name
//         const [firstName, lastName] = fullName.split(' ').filter(i => i);

//         // Get the user data path
//         const userDataPath = await ipcRenderer.invoke('get-user-data-path');

//         // Construct the path to the single finished results file
//         const studentsDir = path.join(userDataPath, 'assets');

//         // Ensure directory exists
//         if (!fs.existsSync(studentsDir)) {
//             fs.mkdirSync(studentsDir, { recursive: true });
//         }

//         const oldFinishedFilePath = path.join(studentsDir, 'finished.xlsx');
//         const newFinishedFilePath = path.join(studentsDir, 'finished_new.xlsx');

//         // Prepare the new result entry
//         const newResult = {
//             'Ism': firstName || fullName,
//             'Familiya': lastName || '',
//             'Sinf': studentGrade,
//             'Ball': `${percentage}%`,
//             'Sana': new Date().toLocaleDateString()
//         };

//         let existingData = [];

//         // Check if the old file exists
//         if (fs.existsSync(oldFinishedFilePath)) {
//             try {
//                 // Read existing workbook
//                 const workbook = xlsx.readFile(oldFinishedFilePath);

//                 // Use the first sheet
//                 const sheetName = workbook.SheetNames[0] || 'Results';
//                 const worksheet = workbook.Sheets[sheetName];

//                 // Convert sheet to JSON
//                 existingData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

//                 // Find if student already exists (match name, surname, and grade)
//                 const studentIndex = existingData.findIndex(
//                     student => 
//                         (student.Ism === newResult.Ism && 
//                          student.Familiya === newResult.Familiya && 
//                          student.Sinf === newResult.Sinf)
//                 );

//                 // If student exists, update their score
//                 if (studentIndex !== -1) {
//                     existingData[studentIndex] = newResult;
//                 } else {
//                     // If student doesn't exist, add new result
//                     existingData.push(newResult);
//                 }
//             } catch (readError) {
//                 console.error('Error reading existing file:', readError);
//                 existingData = [newResult];
//             }
//         } else {
//             // If file doesn't exist, create new data
//             existingData = [newResult];
//         }

//         // Create new workbook
//         const workbook = xlsx.utils.book_new();
//         const worksheet = xlsx.utils.json_to_sheet(existingData);
//         xlsx.utils.book_append_sheet(workbook, worksheet, 'Results');

//         // Write to new file
//         xlsx.writeFile(workbook, newFinishedFilePath);

//         // Delete old file if it exists
//         if (fs.existsSync(oldFinishedFilePath)) {
//             fs.unlinkSync(oldFinishedFilePath);
//         }

//         // Rename new file to original filename
//         fs.renameSync(newFinishedFilePath, oldFinishedFilePath);

//         alert.show(`Результаты теста обновлены в ${oldFinishedFilePath}`, 'success');

//     } catch (error) {
//         console.error('Error saving quiz results:', error);
//         alert.show('Не удалось сохранить результаты теста', 'error');
//     }
// }

function showResult() {
    document.getElementById('quiz-section').style.display = 'none';
    document.getElementById('result-section').style.display = 'block';

    // Calculate score dynamically by comparing selected answers with correct answers
    let correctAnswersCount = 0;
    const detailedResultsContainer = document.createElement('div');
    detailedResultsContainer.className = 'detailed-results';

    currentQuestions.forEach((question, index) => {
        const questionResultDiv = document.createElement('div');
        questionResultDiv.className = 'question-result';

        // Question text
        const questionText = document.createElement('p');
        questionText.textContent = `Вопрос ${index + 1}: ${question.question}`;
        questionResultDiv.appendChild(questionText);

        // Correct answer
        const correctAnswerText = document.createElement('p');
        const correctAnswer = question.options[question.correctIndex - 1];
        correctAnswerText.textContent = `Правильный ответ: ${correctAnswer}`;
        correctAnswerText.className = 'correct-answer';
        questionResultDiv.appendChild(correctAnswerText);

        // User's selected answer
        const userAnswerText = document.createElement('p');
        if (selectedAnswers[index] !== undefined) {
            const userAnswer = question.options[selectedAnswers[index]];
            userAnswerText.textContent = `Ваш ответ: ${userAnswer}`;

            // Check if the selected answer is correct
            if (selectedAnswers[index] + 1 === question.correctIndex) {
                correctAnswersCount++;
                userAnswerText.className = 'correct-user-answer';
            } else {
                userAnswerText.className = 'incorrect-user-answer';
            }
        } else {
            userAnswerText.textContent = 'Ответ не выбран';
            userAnswerText.className = 'no-answer';
        }
        questionResultDiv.appendChild(userAnswerText);

        detailedResultsContainer.appendChild(questionResultDiv);
    });


    console.log(correctAnswersCount, 'correctAnswersCount');

    // Calculate percentage
    const percentage = Math.round((correctAnswersCount / currentQuestions.length) * 100);

    // Add student name to results
    const resultSection = document.getElementById('result-section');
    const studentResult = document.createElement('p');
    studentResult.className = 'student-result';
    studentResult.textContent = `${studentFullName}, ваш результат:`;
    resultSection.insertBefore(studentResult, resultSection.firstChild);

    // Create and append score element

    document.getElementById('score').textContent = `${percentage}%`;


    // Append detailed results
    // resultSection.appendChild(detailedResultsContainer);

    clearInterval(timer);

    // Save quiz results
    // saveQuizResults(studentFullName, percentage);
}

document.getElementById('grade').addEventListener('change', function () {
    const grade = this.value;
    // Fetch students for the selected grade and populate the student-search dropdown
    // This example uses a placeholder function fetchStudents()
    fetchStudentsForClass(grade).then(students => {
        const studentSearch = document.getElementById('student-search');
        studentSearch.innerHTML = '<option value="">O\'quvchini tanlang</option>';
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = `${student.firstName} ${student.lastName}`;
            option.textContent = `${student.firstName} ${student.lastName}`;
            studentSearch.appendChild(option);
        });
    });
});

async function fetchStudentsForClass(grade) {
    try {
        const userDataPath = await ipcRenderer.invoke('get-user-data-path');
        const studentsFilePath = path.join(userDataPath, 'assets', grade, 'students.xlsx');
        // Check if the file exists
        if (!fs.existsSync(studentsFilePath)) {
            console.warn('Файл с данными учеников не найден:', studentsFilePath);
            return [];
        }

        const studentsData = readStudentsFromExcel(studentsFilePath);
        return studentsData;
    } catch (error) {
        console.error('Ошибка при получении данных учеников:', error);
        alert.show('Ошибка при загрузке данных учеников. Проверьте формат файла Excel.\n\nДетали ошибки: ' + error.message, "error");
        return [];
    }
}

function readStudentsFromExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    return data.map(row => ({
        // id: row['ID'], // Assuming there's an 'ID' column
        firstName: row['Ism'],
        lastName: row['Familiya']
    }));
}

// Запускаем инициализацию при загрузке страницы
window.addEventListener('load', () => {
    document.getElementById('student-form').style.display = 'block';
    document.getElementById('quiz-section').style.display = 'none';
});

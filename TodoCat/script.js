const inputForm = document.querySelector('.input-form');
const inputBar = document.querySelector('.input-bar');
const taskList = document.querySelector('.task-list');
const clearButton = document.querySelector('.clear-button');
const currentScore = document.querySelector('.current-score');
const targetScore = document.querySelector('.target-score');

const rewardButton = document.querySelector('.reward-button');
const rewardModal = document.querySelector('.modal');
const rewardImage = document.querySelector('.cat-image');
const closeElements = document.querySelectorAll('[data-modal-close]');

function updateEmptyState() {
    const taskCount = taskList.querySelectorAll('.task').length;
    const existingEmptyState = taskList.querySelector('.empty-state');

    if (taskCount === 0 && !existingEmptyState) {
        const emptyState = document.createElement('li');
        emptyState.className = 'empty-state';
        emptyState.textContent = '태스크를 추가하세요';
        taskList.appendChild(emptyState);
    }

    if (taskCount > 0 && existingEmptyState) {
        existingEmptyState.remove();
    }
}

function updateCurrentScore(delta) {
    const value = Number(currentScore.textContent);
    currentScore.textContent = String(Math.max(0, value + delta));
}

function updateTargetScore(delta) {
    const value = Number(targetScore.textContent);
    targetScore.textContent = String(Math.max(0, value + delta));
}

function resetScores() {
    currentScore.textContent = '0';
    targetScore.textContent = '0';
}

function validateScore() {
    const current = Number(currentScore.textContent);
    const target = Number(targetScore.textContent);

    if (current !== 0 && target !== 0 && (current === target)) {
        rewardButton.className = 'reward-button en-reward-button';
        rewardButton.disabled = false;
    } else {
        rewardButton.className = 'reward-button di-reward-button';
        rewardButton.disabled = true;
    }
}

function openRewardModal() {
    const num = Math.floor(Math.random() * 12) + 1;
    rewardImage.src = `./cats/${num}.jpg`;
    rewardModal.classList.add('is-open');
}

function closeRewardModal() {
    rewardModal.classList.remove('is-open');
}

function createTaskItem(taskText) {
    const taskItem = document.createElement('li');
    taskItem.className = 'task';

    const checkbox = document.createElement('input');
    checkbox.className = 'check-box';
    checkbox.type = 'checkbox';

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = taskText;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.textContent = 'X';

    checkbox.addEventListener('change', (event) => {
        updateCurrentScore(event.target.checked ? 1 : -1);
        validateScore();
    });

    deleteButton.addEventListener('click', () => {
        if (checkbox.checked) {
            updateCurrentScore(-1);
        }

        taskItem.remove();
        updateTargetScore(-1);
        updateEmptyState();
        validateScore();
    });

    taskItem.append(checkbox, title, deleteButton);
    return taskItem;
}

inputForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const taskText = inputBar.value.trim();
    if (!taskText) {
        inputBar.focus();
        return;
    }

    const taskItem = createTaskItem(taskText);
    taskList.appendChild(taskItem);

    updateTargetScore(1);
    updateEmptyState();
    validateScore();

    inputBar.value = '';
    inputBar.focus();
});

clearButton.addEventListener('click', () => {
    taskList.innerHTML = '';
    resetScores();
    updateEmptyState();
    validateScore();
});

rewardButton.addEventListener('click', () => {
    if (rewardButton.disabled) {
        return;
    }

    openRewardModal();
});

closeElements.forEach((element) => {
    element.addEventListener('click', closeRewardModal);
});

updateEmptyState();
validateScore();

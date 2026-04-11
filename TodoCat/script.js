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

// 백엔드 엔드포인트
const API_BASE_URL = 'http://127.0.0.1:8000';
const TASK_API_URL = `${API_BASE_URL}/tasks`;

// 중복 제출 방지
// 태스크 추가가 진행 중일 때 true
let isSubmitting = false;

// 현재 점수 현황 업데이트
function updateScoreboard(tasks) {
    const completedCount = tasks.filter((task) => task.done).length; // done === true인 태스크 수 계산
    currentScore.textContent = String(completedCount);
    targetScore.textContent = String(tasks.length);
    validateScore();
}


// 리워드 버튼 활성화 여부 검사
function validateScore() {
    const current = Number(currentScore.textContent);
    const target = Number(targetScore.textContent);
    const canReward = current !== 0 && target !== 0 && current === target;
    rewardButton.className = `reward-button ${canReward ? 'en-reward-button' : 'di-reward-button'}`;
    rewardButton.disabled = !canReward;
}

// 리워드 모달을 열어 랜덤 고양이 사진 표시
function openRewardModal() {
    const num = Math.floor(Math.random() * 12) + 1;
    rewardImage.src = `./cats/${num}.jpg`;
    rewardModal.classList.add('is-open');
}

// 리워드 모달 닫기
function closeRewardModal() {
    rewardModal.classList.remove('is-open');
}

// 태스크가 없을 때의 UI 렌더링
function renderEmptyState() {
    const emptyState = document.createElement('li');
    emptyState.className = 'empty-state';
    emptyState.textContent = '태스크를 추가하세요';
    taskList.appendChild(emptyState);
}

// 공통 API 요청 함수
// fetch와 에러를 한 곳에서 처리
async function request(url, options = {}) {
    // JSON 요청 기본 헤더
    // 필요하면 외부에서 추가 헤더를 덮어쓰기
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    // HTTP 상태코드가 2xx가 아니면 에러 처리
    if (!response.ok) {
        // 기본 에러 메시지
        let message = `요청 처리에 실패했습니다. (${response.status})`;

        // FastAPI의 {"detail": "..."} 에러 메시지 사용
        try {
            const data = await response.json();
            if (typeof data.detail === 'string') {
                message = data.detail;
            }
        } catch (_error) {
            // 응답 본문이 비어 있거나 JSON이 아니면 기본 에러 메시지 사용
        }
        throw new Error(message);
    }

    // 204 No Content 응답이면 반환할 JSON이 없으므로 null 반환
    if (response.status === 204) {
        return null;
    }

    // 그 외에는 JSON 데이터 반환
    return response.json();
}

// 태스크 DOM 요소 생성
function createTaskItem(task) {
    const taskItem = document.createElement('li');
    taskItem.className = 'task';
    taskItem.dataset.taskId = String(task.id); // data-task-id 읽기 전용 속성에 id 저장

    const checkbox = document.createElement('input');
    checkbox.className = 'check-box';
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.content;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.textContent = 'X';

    // 체크박스 변경 이벤트
    checkbox.addEventListener('change', async (event) => {
        const nextDone = event.target.checked;

        // 요청 도중 중복 입력 방지
        checkbox.disabled = true;
        deleteButton.disabled = true;

        // FastAPI PUT 요청으로 done 상태 갱신
        try {
            await request(`${TASK_API_URL}/${task.id}`, {
                method: 'PUT',
                body: JSON.stringify({ done: nextDone }),
            });
            await loadTasks(); // 최신 상태를 가져와서 목록 갱신
        } catch (error) {
            // 실패하면 롤백
            checkbox.checked = !nextDone;
            console.error(error);
        } finally {
            // 버튼 다시 활성화
            checkbox.disabled = false;
            deleteButton.disabled = false;
        }
    });

    // 삭제 버튼 클릭 이벤트
    deleteButton.addEventListener('click', async () => {
        checkbox.disabled = true;
        deleteButton.disabled = true;

        // FastAPI DELETE 요청으로 태스크 삭제
        try {
            await request(`${TASK_API_URL}/${task.id}`, { method: 'DELETE' });
            await loadTasks(); // 삭제 후 목록 갱신
        } catch (error) {
            // 실패하면 다시 조작 가능하도록 복구
            checkbox.disabled = false;
            deleteButton.disabled = false;
            console.error(error);
        }
    });

    // <li> 안에 요소들 삽입
    taskItem.append(checkbox, title, deleteButton);
    return taskItem;
}

// 태스크 목록 전체 렌더링
function renderTasks(tasks) {
    // 기존 목록 초기화
    taskList.innerHTML = '';

    // 태스크가 없으면 없으면 빈 상태 표시
    if (tasks.length === 0) {
        renderEmptyState();
        updateScoreboard([]);
        return;
    }

    // 태스크마다 DOM을 생성해서 목록에 추가
    tasks.forEach((task) => {
        taskList.appendChild(createTaskItem(task));
    });

    // 목록을 그린 후 점수 현황 갱신
    updateScoreboard(tasks);
}

// FastAPI GET 요청으로 가져온 태스크 데이터를 화면에 렌더링
async function loadTasks() {
    try {
        const tasks = await request(TASK_API_URL);
        renderTasks(tasks);
    } catch (error) {
        // 실패 시에도 화면이 깨지지 않도록 빈 상태로 초기화
        taskList.innerHTML = '';
        renderEmptyState();
        updateScoreboard([]);
        console.error(error);
    }
}

// 새 태스크 생성 이벤트
inputForm.addEventListener('submit', async (event) => {
    // form 페이지 새로고침 막기
    event.preventDefault();

    const taskText = inputBar.value.trim();

    // 빈 문자열이거나 이미 제출 중이면 무시
    if (!taskText || isSubmitting) {
        inputBar.focus();
        return;
    }

    // 제출 중 상태로 변경
    isSubmitting = true;
    inputBar.disabled = true;

    // FastAPI POST 요청으로 새 태스크 생성
    try {
        await request(TASK_API_URL, {
            method: 'POST',
            body: JSON.stringify({
                content: taskText,
                done: false,
            }),
        });

        // 입력창 비우기
        inputBar.value = '';

        // 목록 다시 불러오기
        await loadTasks();
    } catch (error) {
        console.error(error);
    } finally {
        // 다시 입력 가능하게 복구
        isSubmitting = false;
        inputBar.disabled = false;
        inputBar.focus();
    }
});

// 전체 태스크 삭제 버튼 이벤트
clearButton.addEventListener('click', async () => {
    clearButton.disabled = true;

    // FastAPI DELETE 요청으로 전체 태스크 삭제
    try {
        await request(TASK_API_URL, { method: 'DELETE' });
        await loadTasks(); // 삭제 후 목록 새로고침
    } catch (error) {
        console.error(error);
    } finally {
        clearButton.disabled = false;
    }
});

// 리워드 버튼 클릭 이벤트
rewardButton.addEventListener('click', () => {
    // 버튼이 활성화 상태일 때만 모달 열기
    if (rewardButton.disabled) {
        return;
    }
    openRewardModal();
});

// 모달 닫기 이벤트
closeElements.forEach((element) => {
    element.addEventListener('click', closeRewardModal);
});

// 앱 시작 시 초기 데이터 로드
loadTasks();
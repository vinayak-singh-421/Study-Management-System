function startProject() {
    alert("Welcome to Study Management System!");
}

/* =========================
   TASK MANAGEMENT
========================= */

function openTaskForm() {
    const form = document.getElementById("taskForm");

    if (form) {
        form.classList.add("show");
    }
}


function closeTaskForm() {
    const form = document.getElementById("taskForm");

    if (form) {
        form.classList.remove("show");
    }
}


/* =========================
   ADD TASK
========================= */

function addTask() {

    const title =
        document.getElementById("taskTitle").value.trim();

    const category =
        document.getElementById("taskCategory").value;

    const date =
        document.getElementById("taskDate").value;

    const priority =
        document.getElementById("taskPriority").value;


    if (title === "") {
        alert("Please enter a task title.");
        return;
    }


    fetch("/api/tasks", {

        method: "POST",

        headers: {
            "Content-Type":
                "application/x-www-form-urlencoded"
        },

        body:
            "title=" + encodeURIComponent(title) +
            "&subject=" + encodeURIComponent(category) +
            "&due_date=" + encodeURIComponent(date)

    })

    .then(function(response) {

        if (!response.ok) {
            throw new Error("Task save failed");
        }

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            alert("Task added successfully! ✅");

            document.getElementById("taskTitle").value = "";
            document.getElementById("taskDate").value = "";

            closeTaskForm();

            displayTasks();
        }

    })

    .catch(function(error) {

        console.error("Task save error:", error);

        alert("Task save nahi ho paya.");

    });
}


/* =========================
   DISPLAY TASKS
========================= */

function displayTasks() {

    const taskList =
        document.getElementById("taskList");

    if (!taskList) {
        return;
    }


    fetch("/api/tasks")

        .then(function(response) {

            if (!response.ok) {
                throw new Error("Failed to load tasks");
            }

            return response.json();

        })

        .then(function(tasks) {

            taskList.innerHTML = "";


            if (tasks.length === 0) {

                taskList.innerHTML = `
                    <div class="empty-tasks">
                        <div>📝</div>
                        <h3>No tasks yet</h3>
                        <p>Add your first study task.</p>
                    </div>
                `;

                updateTaskCounts();

                return;
            }


            tasks.forEach(function(task) {

                const taskElement =
                    document.createElement("div");

                taskElement.className = "full-task";


                if (task.completed == 1) {

                    taskElement.classList.add(
                        "completed-task"
                    );

                }


                taskElement.setAttribute(
                    "data-status",
                    task.completed == 1
                        ? "completed"
                        : "pending"
                );


                let categoryIcon = "📚";


                if (task.subject === "Coding") {
                    categoryIcon = "💻";
                }

                else if (task.subject === "Project") {
                    categoryIcon = "🚀";
                }

                else if (task.subject === "Revision") {
                    categoryIcon = "📖";
                }


                taskElement.innerHTML = `

                    <div class="task-check">

                        <input
                            type="checkbox"
                            ${task.completed == 1 ? "checked" : ""}
                            onchange="updateTaskStatus(this, ${task.id})"
                        >

                    </div>


                    <div class="full-task-info">

                        <strong>
                            ${task.title}
                        </strong>

                        <span>
                            ${categoryIcon}
                            ${task.subject || "Study"}
                            ·
                            ${task.due_date || "No deadline"}
                        </span>

                    </div>


                    <button
                        class="delete-task"
                        onclick="deleteTask(this, ${task.id})"
                    >
                        🗑️
                    </button>

                `;


                taskList.appendChild(taskElement);

            });


            updateTaskCounts();

        })

        .catch(function(error) {

            console.error(
                "Task loading error:",
                error
            );

        });
}


/* =========================
   UPDATE TASK STATUS
========================= */

function updateTaskStatus(checkbox, taskId) {

    const task =
        checkbox.closest(".full-task");


    const completed =
        checkbox.checked ? 1 : 0;


    fetch("/api/tasks/" + taskId, {

        method: "PUT",

        headers: {
            "Content-Type":
                "application/x-www-form-urlencoded"
        },

        body:
            "completed=" +
            encodeURIComponent(completed)

    })

    .then(function(response) {

        if (!response.ok) {
            throw new Error("Status update failed");
        }

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            if (completed === 1) {

                task.classList.add(
                    "completed-task"
                );

                task.setAttribute(
                    "data-status",
                    "completed"
                );

            }

            else {

                task.classList.remove(
                    "completed-task"
                );

                task.setAttribute(
                    "data-status",
                    "pending"
                );

            }

            updateTaskCounts();

        }

    })

    .catch(function(error) {

        console.error(
            "Task status error:",
            error
        );

        alert(
            "Task status update nahi ho paya."
        );

    });
}


/* =========================
   DELETE TASK
========================= */

function deleteTask(button, taskId) {

    if (!confirm("Delete this task?")) {
        return;
    }


    fetch("/api/tasks/" + taskId, {

        method: "DELETE"

    })

    .then(function(response) {

        if (!response.ok) {
            throw new Error("Delete failed");
        }

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            alert(
                "Task deleted successfully! ✅"
            );

            displayTasks();

        }

    })

    .catch(function(error) {

        console.error(
            "Task delete error:",
            error
        );

        alert(
            "Task delete nahi ho paya."
        );

    });
}


/* =========================
   TASK COUNTS
========================= */

function updateTaskCounts() {

    const tasks =
        document.querySelectorAll(".full-task");


    let completed = 0;


    tasks.forEach(function(task) {

        if (
            task.getAttribute("data-status")
            === "completed"
        ) {

            completed++;

        }

    });


    const total = tasks.length;

    const pending =
        total - completed;


    const totalElement =
        document.getElementById("totalTasks");

    const completedElement =
        document.getElementById("completedTasks");

    const pendingElement =
        document.getElementById("pendingTasks");


    if (totalElement) {
        totalElement.textContent = total;
    }

    if (completedElement) {
        completedElement.textContent = completed;
    }

    if (pendingElement) {
        pendingElement.textContent = pending;
    }
}


/* =========================
   FILTER TASKS
========================= */

function filterTasks(type, button) {

    const tasks =
        document.querySelectorAll(".full-task");


    document
        .querySelectorAll(".filter-btn")
        .forEach(function(btn) {

            btn.classList.remove("active");

        });


    if (button) {
        button.classList.add("active");
    }


    tasks.forEach(function(task) {

        const status =
            task.getAttribute("data-status");


        if (type === "all") {

            task.style.display = "flex";

        }

        else if (status === type) {

            task.style.display = "flex";

        }

        else {

            task.style.display = "none";

        }

    });

}


/* =========================
   SEARCH TASKS
========================= */

function searchTasks() {

    const search =
        document
            .getElementById("taskSearch")
            .value
            .toLowerCase();


    const tasks =
        document.querySelectorAll(".full-task");


    tasks.forEach(function(task) {

        const text =
            task.textContent.toLowerCase();


        if (text.includes(search)) {

            task.style.display = "flex";

        }

        else {

            task.style.display = "none";

        }

    });

}


/* =========================
   LOAD TASKS
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        if (
            document.getElementById("taskList")
        ) {

            displayTasks();

        }

    }
);

/* SUBJECT MANAGEMENT
========================= */

let editingSubjectId = null;

function openSubjectForm() {

    const form =
        document.getElementById("subjectForm");

    if (form) {
        form.classList.add("show");
    }
}


function closeSubjectForm() {

    const form =
        document.getElementById("subjectForm");

    if (form) {
        form.classList.remove("show");
    }

    editingSubjectId = null;
}


function editSubject(id, name, code, teacher, credits) {

    editingSubjectId = id;

    document.getElementById("subjectName").value = name || "";
    document.getElementById("subjectCode").value = code || "";
    document.getElementById("facultyName").value = teacher || "";

    const creditsField = document.getElementById("subjectCredits");
    if (creditsField) {
        creditsField.value = credits || "";
    }

    openSubjectForm();
}


function addSubject() {

    const name =
        document
            .getElementById("subjectName")
            .value
            .trim();

    const code =
        document
            .getElementById("subjectCode")
            .value
            .trim();

    const faculty =
        document
            .getElementById("facultyName")
            .value
            .trim();

    const creditsField =
        document
            .getElementById("subjectCredits");

    const credits =
        creditsField ? creditsField.value : "";


    if (!name) {

        alert("Please enter subject name.");

        return;
    }

    const isEditing = editingSubjectId !== null;

    const url = isEditing ? "/api/subjects/" + editingSubjectId : "/api/subjects";
    const method = isEditing ? "PUT" : "POST";

    fetch(url, {

        method: method,

        headers: {
            "Content-Type":
                "application/x-www-form-urlencoded"
        },

        body:
            "name=" +
            encodeURIComponent(name) +

            "&code=" +
            encodeURIComponent(code) +

            "&teacher=" +
            encodeURIComponent(faculty) +

            "&credits=" +
            encodeURIComponent(credits)

    })

    .then(function(response) {

        if (!response.ok) {
            throw new Error("Save failed");
        }

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            alert(
                isEditing ? "Subject updated successfully! ✅" : "Subject added successfully! ✅"
            );

            document
                .getElementById("subjectName")
                .value = "";

            document
                .getElementById("subjectCode")
                .value = "";

            document
                .getElementById("facultyName")
                .value = "";

            if (creditsField) {
                creditsField.value = "";
            }

            editingSubjectId = null;

            closeSubjectForm();

            displaySubjects();
        }

    })

    .catch(function(error) {

        console.error(error);

        alert(
            "Subject save nahi ho paya."
        );

    });
}


function displaySubjects() {

    const grid =
        document.getElementById(
            "subjectsGrid"
        );

    if (!grid) {
        return;
    }


    fetch("/api/subjects")

        .then(function(response) {

            return response.json();

        })

        .then(function(subjects) {

            grid.innerHTML = "";


            if (subjects.length === 0) {

                grid.innerHTML = `

                    <div class="empty-subjects">

                        <div>📚</div>

                        <h3>
                            No subjects added
                        </h3>

                        <p>
                            Add your first subject
                            to get started.
                        </p>

                    </div>

                `;

                updateSubjectCount(0);

                return;
            }


            subjects.forEach(function(subject) {

                const card =
                    document.createElement("div");

                card.className =
                    "subject-card" + (subject.completed ? " is-completed" : "");


                card.innerHTML = `

                    <div class="subject-top">

                        <div class="subject-icon">
                            📚
                        </div>

                        <div class="subject-card-actions">

                            <button
                                class="delete-btn"
                                onclick='editSubject(${subject.id}, ${JSON.stringify(subject.name)}, ${JSON.stringify(subject.code || "")}, ${JSON.stringify(subject.teacher || "")}, ${JSON.stringify(subject.credits || 0)})'
                            >
                                ✏️
                            </button>

                            <button
                                class="delete-btn"
                                onclick="deleteSubject(${subject.id})"
                            >
                                🗑️
                            </button>

                        </div>

                    </div>

                    <h3>
                        ${subject.name}
                    </h3>

                    <p class="subject-code">
                        ${subject.code || "No code"}
                    </p>

                    <div class="faculty">
                        👨‍🏫 Faculty:
                        ${subject.teacher || "Not added"}
                    </div>

                    <div class="subject-bottom">

                        <span>
                            ${subject.code || "Subject"}
                        </span>

                        <span>
                            ${Number(subject.credits) || 0} Credits
                        </span>

                    </div>

                    <button
                        type="button"
                        class="toggle-subject-complete-btn"
                        onclick="toggleSubjectCompleted(${subject.id}, ${subject.completed ? "false" : "true"})"
                    >
                        ${subject.completed ? "✅ Completed" : "Mark Completed"}
                    </button>

                `;


                grid.appendChild(card);

            });


            updateSubjectCount(
                subjects.length
            );

            const completedCount = subjects.filter(function(s) { return !!s.completed; }).length;
            const inProgressCount = subjects.length - completedCount;
            const avgProgress = subjects.length > 0 ? Math.round((completedCount / subjects.length) * 100) : 0;

            const completedEl = document.getElementById("subjectCompletedCount");
            const inProgressEl = document.getElementById("subjectInProgressCount");
            const avgProgressEl = document.getElementById("subjectAvgProgress");

            if (completedEl) completedEl.textContent = completedCount;
            if (inProgressEl) inProgressEl.textContent = inProgressCount;
            if (avgProgressEl) avgProgressEl.textContent = avgProgress + "%";

        })

        .catch(function(error) {

            console.error(
                "Subject loading error:",
                error
            );

        });
}


function toggleSubjectCompleted(id, newCompletedState) {

    fetch("/api/subjects/" + id, {

        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({ completed: newCompletedState })

    })

    .then(function(response) {
        return response.json();
    })

    .then(function(result) {

        if (!result.success) {
            throw new Error("Update failed");
        }

        displaySubjects();

    })

    .catch(function(error) {
        console.error(error);
        alert("Subject status update nahi ho paya.");
    });
}


function deleteSubject(id) {

    if (
        !confirm(
            "Delete this subject?"
        )
    ) {
        return;
    }


    fetch(
        "/api/subjects/" + id,
        {
            method: "DELETE"
        }
    )

    .then(function(response) {

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            alert(
                "Subject deleted successfully! ✅"
            );

            displaySubjects();

        }

    })

    .catch(function(error) {

        console.error(error);

        alert(
            "Subject delete nahi ho paya."
        );

    });
}


function updateSubjectCount(count) {

    const element =
        document.getElementById(
            "subjectCount"
        );

    if (element) {
        element.textContent = count;
    }
}


if (
    document.getElementById("subjectsGrid")
) {

    displaySubjects();

}

/* =========================
   DSA PROBLEM TRACKER
========================= */

function addDSAProblem() {

    const problemName =
        document.getElementById("problemName").value.trim();

    const topic =
        document.getElementById("problemTopic").value;

    const difficulty =
        document.getElementById("problemDifficulty").value;


    if (problemName === "") {

        alert("Please enter problem name.");

        return;
    }


    /*
     * Problem ko browser memory mein temporarily save kar rahe hain.
     * Database hum later Flask + SQLite ke saath connect karenge.
     */

    const problem = {
        name: problemName,
        topic: topic,
        difficulty: difficulty
    };


    let problems =
        JSON.parse(
            JSON.stringify(window.__dsaProblems || [])
        ) || [];


    fetch("/api/dsa", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(problem)})
        .then(r => r.json())
        .then(saved => {
            if (!saved.error) {
                problems.push(saved);
                window.__dsaProblems = problems;
                updateDSACounters(); updateDifficultyCounts(); updateDSATopicProgress(); updateWeeklyGoal(); displayDSAProblems();
            } else { alert(saved.error); }
        })
        .catch(() => alert("Unable to save DSA problem to database."));


    /*
     * Difficulty counter update
     */

    updateDSACounters();

    updateDifficultyCounts();

    updateWeeklyGoal();


    /*
     * Form clear
     */

    document.getElementById(
        "problemName"
    ).value = "";


    alert(
        `"${problemName}" added successfully!`
    );
}


/* =========================
   UPDATE DSA COUNTERS
========================= */

function updateDSACounters() {

    const problems =
        JSON.parse(
            JSON.stringify(window.__dsaProblems || [])
        ) || [];


    const solvedCount =
        problems.filter(function(p) { return !!p.solved; }).length;


    const solved =
        document.getElementById("dsaSolved");


    if (solved) {

        solved.textContent = solvedCount;

    }


    const easyTop = document.getElementById("dsaEasyTop");
    const mediumTop = document.getElementById("dsaMediumTop");
    const streakTop = document.getElementById("dsaStreakTop");

    if (easyTop) {
        easyTop.textContent = problems.filter(function(p) { return p.solved && p.difficulty === "Easy"; }).length;
    }

    if (mediumTop) {
        mediumTop.textContent = problems.filter(function(p) { return p.solved && p.difficulty === "Medium"; }).length;
    }

    if (streakTop) {
        const solvedDates = new Set(
            problems.filter(function(p) { return p.solved && p.solved_date; })
                .map(function(p) { return p.solved_date; })
        );

        let streak = 0;
        let cursor = new Date();

        const todayIso = cursor.toISOString().split("T")[0];
        if (!solvedDates.has(todayIso)) {
            cursor.setDate(cursor.getDate() - 1);
        }

        while (solvedDates.has(cursor.toISOString().split("T")[0])) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }

        streakTop.textContent = streak + (streak === 1 ? " Day" : " Days");
    }
}


/* =========================
   LOAD DSA DATA
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        if (document.getElementById("dsaSolved")) {
            fetch("/api/dsa").then(r=>r.json()).then(data=>{ window.__dsaProblems = Array.isArray(data) ? data : []; updateDSACounters(); displayDSAProblems(); updateDifficultyCounts(); updateDSATopicProgress(); updateWeeklyGoal(); }).catch(()=>{});
        }

    }
);

function deleteDSAProblem(id) {
    if (!id) return;
    fetch(`/api/dsa/${id}`, { method: "DELETE" })
        .then(r => r.json())
        .then(result => {
            if (!result.success) throw new Error("Delete failed");
            window.__dsaProblems = (window.__dsaProblems || []).filter(p => Number(p.id) !== Number(id));
            updateDSACounters();
            updateDifficultyCounts();
            updateDSATopicProgress();
            updateWeeklyGoal();
            displayDSAProblems();
        })
        .catch(() => alert("Problem delete nahi ho paya."));
}

/* =========================
   DISPLAY SOLVED PROBLEMS
========================= */

function displayDSAProblems() {

    const problems =
        JSON.parse(
            JSON.stringify(window.__dsaProblems || [])
        ) || [];


    const list =
        document.getElementById(
            "solvedProblemsList"
        );


    const total =
        document.getElementById(
            "problemTotal"
        );

    const solvedListTotalEl =
        document.getElementById(
            "solvedListTotal"
        );


    if (!list) {
        return;
    }


    if (total) {

        total.textContent =
            problems.length + " Problems";

    }

    if (solvedListTotalEl) {

        const solvedCount = problems.filter(function(p) { return !!p.solved; }).length;

        solvedListTotalEl.textContent =
            solvedCount + " Solved";

    }


    if (problems.length === 0) {

        list.innerHTML = `
            <div class="empty-problems">
                No problems added yet.
            </div>
        `;

        return;
    }


    list.innerHTML = "";


    problems
        .slice()
        .reverse()
        .forEach(function (problem) {

            const item =
                document.createElement("div");

            item.className =
                "solved-problem-item" + (problem.solved ? " is-solved" : "");


            item.innerHTML = `
                <div class="problem-details">
                    <strong></strong>
                    <span></span>
                </div>
                <span class="difficulty-badge"></span>
                <button type="button" class="toggle-solved-btn"></button>
                <button type="button" class="delete-dsa-btn" data-id="${problem.id}">Delete</button>
            `;
            item.querySelector("strong").textContent = problem.name || "Untitled problem";
            item.querySelector("span").textContent = problem.topic || "General";
            const badge = item.querySelector(".difficulty-badge");
            const difficulty = problem.difficulty || "Unknown";
            badge.textContent = difficulty;
            badge.classList.add(difficulty.toLowerCase());
            const toggleBtn = item.querySelector(".toggle-solved-btn");
            toggleBtn.textContent = problem.solved ? "✅ Solved" : "Mark Solved";
            toggleBtn.addEventListener("click", function () {
                toggleDSAProblemSolved(problem.id, !problem.solved);
            });
            item.querySelector(".delete-dsa-btn").addEventListener("click", function () {
                deleteDSAProblem(problem.id);
            });
            list.appendChild(item);

        });
}


function toggleDSAProblemSolved(id, newSolvedState) {

    fetch(`/api/dsa/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solved: newSolvedState })
    })
        .then(r => r.json())
        .then(result => {
            if (!result.success) throw new Error("Update failed");

            const problems = window.__dsaProblems || [];
            const idx = problems.findIndex(p => Number(p.id) === Number(id));
            if (idx !== -1 && result.problem) {
                problems[idx] = result.problem;
            }
            window.__dsaProblems = problems;

            updateDSACounters();
            updateDifficultyCounts();
            updateDSATopicProgress();
            updateWeeklyGoal();
            displayDSAProblems();
        })
        .catch(() => alert("Problem status update nahi ho paya."));
}


/* Load problems when page opens */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        displayDSAProblems();

    }
);

/* =========================
   UPDATE DSA TOPIC PROGRESS
========================= */

function updateDSATopicProgress() {

    const problems =
        JSON.parse(
            JSON.stringify(window.__dsaProblems || [])
        ) || [];


    const topicElements =
        document.querySelectorAll(".dsa-topic");


    topicElements.forEach(function (topicElement) {

        const topicName =
            topicElement
                .querySelector(".topic-heading strong")
                .textContent
                .trim();


        const progressText =
            topicElement.querySelector(
                ".topic-heading span"
            );


        const progressBar =
            topicElement.querySelector(
                ".progress-fill"
            );


        const problemCount =
            topicElement.querySelector(
                ".topic-info small"
            );


        /*
         * Is topic ke kitne problems solve hue
         */

        const solved =
            problems.filter(function (problem) {

                return problem.topic === topicName && !!problem.solved;

            }).length;


        /*
         * Demo ke liye har topic ka target 20 problems hai
         */

        const total = 20;


        let percentage =
            Math.round(
                (solved / total) * 100
            );


        /*
         * Existing demo progress ko minimum
         * preserve karenge jab tak database
         * integration nahi hota.
         */

        if (percentage > 100) {
            percentage = 100;
        }


        if (progressText) {

            progressText.textContent =
                percentage + "%";

        }

        if (progressBar) {

            progressBar.style.width =
                percentage + "%";

        }

        if (problemCount) {

            problemCount.textContent =
                solved + " / " + total + " Problems";

        }

    });

}


/* Update progress after adding problem */

const oldAddDSAProblem =
    window.addDSAProblem;


/*
 * Page load par progress calculate karo
 */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateDSATopicProgress();

    }
);

/* =========================
   UPDATE DIFFICULTY COUNTS
========================= */

function updateDifficultyCounts() {

    const problems =
        JSON.parse(
            JSON.stringify(window.__dsaProblems || [])
        ) || [];


    let easy = 0;
    let medium = 0;
    let hard = 0;


    problems.forEach(function (problem) {

        if (!problem.solved) {
            return;
        }

        if (problem.difficulty === "Easy") {
            easy++;
        }

        else if (problem.difficulty === "Medium") {
            medium++;
        }

        else if (problem.difficulty === "Hard") {
            hard++;
        }

    });


    const easyElement =
        document.getElementById("easyCount");

    const mediumElement =
        document.getElementById("mediumCount");

    const hardElement =
        document.getElementById("hardCount");


    if (easyElement) {
        easyElement.textContent = easy;
    }

    if (mediumElement) {
        mediumElement.textContent = medium;
    }

    if (hardElement) {
        hardElement.textContent = hard;
    }
}

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateDifficultyCounts();

    }
);

/* =========================
   WEEKLY DSA GOAL
========================= */

function updateWeeklyGoal() {

    const problems =
        JSON.parse(
            JSON.stringify(window.__dsaProblems || [])
        ) || [];


    const target = 10;

    // Current week (Monday-Sunday)
    const now = new Date();
    const jsDay = now.getDay();
    const mondayOffset = jsDay === 0 ? 6 : jsDay - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const solvedThisWeek =
        problems.filter(function(p) {
            if (!p.solved || !p.solved_date) return false;
            const solvedOn = new Date(p.solved_date + "T00:00:00");
            return solvedOn >= weekStart;
        }).length;

    const solved =
        Math.min(solvedThisWeek, target);


    const percentage =
        Math.round((solved / target) * 100);


    const solvedElement =
        document.getElementById("weeklySolved");

    const progressElement =
        document.getElementById("weeklyProgress");

    const messageElement =
        document.getElementById("weeklyMessage");


    if (solvedElement) {
        solvedElement.textContent = solved;
    }


    if (progressElement) {
        progressElement.style.width =
            percentage + "%";
    }


    if (messageElement) {

        if (solved === target) {

            messageElement.textContent =
                "🎉 Weekly goal completed! Great work!";

        } else {

            const remaining =
                target - solved;

            messageElement.textContent =
                `Only ${remaining} more problem${
                    remaining === 1 ? "" : "s"
                } to reach your weekly goal.`;

        }

    }
}

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateWeeklyGoal();

    }
)

/* =========================
   STUDY TIMER / SESSIONS
========================= */

let timerInterval = null;
let timerSecondsLeft = 25 * 60;
let selectedStudyMinutes = 25;
let selectedSessionType = "study";
let timerRunning = false;


/* =========================
   SET SESSION TYPE (STUDY / CODING)
========================= */

function setSessionType(type, button) {

    selectedSessionType = type;

    document
        .querySelectorAll(".mode-preset")
        .forEach(function(btn) {
            btn.classList.remove("active");
        });

    if (button) {
        button.classList.add("active");
    }
}


/* =========================
   SET STUDY TIME
========================= */

function setStudyTime(minutes, button) {

    clearInterval(timerInterval);

    timerInterval = null;
    timerRunning = false;

    selectedStudyMinutes = minutes;
    timerSecondsLeft = minutes * 60;

    updateTimerDisplay();

    const status = document.getElementById("timerStatus");

    if (status) {
        status.textContent = "Ready to study 📚";
    }

    document
        .querySelectorAll(".duration-preset")
        .forEach(function(btn) {
            btn.classList.remove("active");
        });

    if (button) {
        button.classList.add("active");
    }
}


/* =========================
   START TIMER
========================= */

function startTimer() {

    if (timerRunning) {
        return;
    }

    if (timerSecondsLeft <= 0) {
        timerSecondsLeft = selectedStudyMinutes * 60;
        updateTimerDisplay();
    }

    timerRunning = true;

    const status =
        document.getElementById("timerStatus");

    if (status) {
        status.textContent =
            "Focus mode is ON 🔥";
    }

    timerInterval = setInterval(function() {

        if (timerSecondsLeft <= 0) {

            completeStudySession();

            return;
        }

        timerSecondsLeft--;

        updateTimerDisplay();

    }, 1000);
}


/* =========================
   PAUSE TIMER
========================= */

function pauseTimer() {

    if (!timerRunning) {
        return;
    }

    clearInterval(timerInterval);

    timerInterval = null;
    timerRunning = false;

    const status =
        document.getElementById("timerStatus");

    if (status) {
        status.textContent =
            "Timer paused ⏸️";
    }
}


/* =========================
   RESET TIMER
========================= */

function resetTimer() {

    clearInterval(timerInterval);

    timerInterval = null;
    timerRunning = false;

    timerSecondsLeft =
        selectedStudyMinutes * 60;

    updateTimerDisplay();

    const status =
        document.getElementById("timerStatus");

    if (status) {
        status.textContent =
            "Ready to study 📚";
    }
}


/* =========================
   UPDATE TIMER DISPLAY
========================= */

function updateTimerDisplay() {

    const minutes =
        Math.floor(timerSecondsLeft / 60);

    const seconds =
        timerSecondsLeft % 60;

    const minuteElement =
        document.getElementById("timerMinutes");

    const secondElement =
        document.getElementById("timerSeconds");

    if (minuteElement) {

        minuteElement.textContent =
            String(minutes).padStart(2, "0");

    }

    if (secondElement) {

        secondElement.textContent =
            String(seconds).padStart(2, "0");

    }
}


/* =========================
   COMPLETE SESSION
========================= */

function completeStudySession() {

    clearInterval(timerInterval);

    timerInterval = null;
    timerRunning = false;

    timerSecondsLeft = 0;

    updateTimerDisplay();

    const status =
        document.getElementById("timerStatus");

    if (status) {

        status.textContent =
            "Study session completed! 🎉";

    }


    /* =========================
       SAVE SESSION
    ========================= */

    const today =
        new Date().toISOString().split("T")[0];


    let sessions =
        JSON.parse(
            JSON.stringify(window.__studySessions || [])
        ) || [];


    const session = {

        id: Date.now(),

        date: today,

        duration: selectedStudyMinutes,

        completed: true

    };


    fetch("/api/study-sessions", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({minutes:selectedStudyMinutes, study_date:today, session_type:selectedSessionType})})
        .then(r => r.json())
        .then(saved => {
            if (!saved.error) {
                sessions.push(normalizeStudySession(saved)); window.__studySessions = sessions; updateTodayStudyMinutes();
            } else { alert(saved.error); }
        })
        .catch(() => alert("Unable to save study session to database."));


    /* =========================
       UPDATE TODAY MINUTES
    ========================= */

    updateTodayStudyMinutes();


    alert(
        "Great job! Your study session is complete. 🎉"
    );
}


/* =========================
   TODAY STUDY MINUTES
========================= */

function updateTodayStudyMinutes() {

    const today =
        new Date().toISOString().split("T")[0];


    const sessions =
        JSON.parse(
            JSON.stringify(window.__studySessions || [])
        ) || [];


    let totalMinutes = 0;


    sessions.forEach(function(session) {

        if (
            session.date === today &&
            session.completed === true &&
            (session.session_type || "study") === "study"
        ) {

            totalMinutes +=
                Number(session.duration) || 0;

        }

    });


    const todayElement =
        document.getElementById("todayMinutes");


    if (todayElement) {

        todayElement.textContent =
            totalMinutes;

    }
}


/* =========================
   SESSION COUNT
========================= */

function getTodaySessionCount() {

    const today =
        new Date().toISOString().split("T")[0];


    const sessions =
        JSON.parse(
            JSON.stringify(window.__studySessions || [])
        ) || [];


    return sessions.filter(function(session) {

        return (
            session.date === today &&
            session.completed === true
        );

    }).length;
}


function normalizeStudySession(session) {
    return {
        id: session.id,
        date: session.date || session.study_date,
        duration: Number(session.duration ?? session.minutes ?? 0),
        completed: session.completed !== false,
        session_type: session.session_type || session.type || "study"
    };
}

/* =========================
   LOAD TIMER DATA
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        if (
            document.getElementById("timerMinutes")
        ) {

            updateTimerDisplay();

            fetch("/api/study-sessions")
                .then(function(response) { return response.json(); })
                .then(function(data) {
                    const sessions = Array.isArray(data) ? data : [];
                    window.__studySessions = sessions.map(normalizeStudySession);
                    updateTodayStudyMinutes();
                })
                .catch(function() {
                    updateTodayStudyMinutes();
                });

        }

    }
);

/* =========================
   NOTES MODULE
========================= */

function showNoteForm() {

    const form =
        document.getElementById("noteForm");

    if (form) {
        form.style.display = "block";
    }
}


function hideNoteForm() {

    const form =
        document.getElementById("noteForm");

    if (form) {
        form.style.display = "none";
    }
}


function saveNote() {

    const title =
        document
            .getElementById("noteTitle")
            .value
            .trim();

    const subject =
        document.getElementById(
            "noteSubject"
        ).value;

    const content =
        document
            .getElementById("noteContent")
            .value
            .trim();


    if (!title || !subject || !content) {

        alert(
            "Please fill all note details."
        );

        return;
    }


    fetch("/api/notes", {

        method: "POST",

        headers: {
            "Content-Type":
                "application/x-www-form-urlencoded"
        },

        body:
            "title=" +
            encodeURIComponent(title) +

            "&subject=" +
            encodeURIComponent(subject) +

            "&content=" +
            encodeURIComponent(content)

    })

    .then(function(response) {

        if (!response.ok) {
            throw new Error(
                "Failed to save note"
            );
        }

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            alert(
                "Note saved successfully! ✅"
            );


            document
                .getElementById("noteTitle")
                .value = "";

            document
                .getElementById("noteSubject")
                .value = "";

            document
                .getElementById("noteContent")
                .value = "";


            hideNoteForm();

            displayNotes();
        }

    })

    .catch(function(error) {

        console.error(
            "Note save error:",
            error
        );

        alert(
            "Note save nahi ho payi."
        );

    });
}


function displayNotes() {

    const grid =
        document.getElementById(
            "notesGrid"
        );

    if (!grid) {
        return;
    }


    fetch("/api/notes")

        .then(function(response) {

            if (!response.ok) {

                throw new Error(
                    "Failed to load notes"
                );

            }

            return response.json();

        })

        .then(function(notes) {

            grid.innerHTML = "";


            if (notes.length === 0) {

                grid.innerHTML = `

                    <div class="empty-notes">

                        <div>📝</div>

                        <h3>
                            No notes yet
                        </h3>

                        <p>
                            Create your first
                            study note.
                        </p>

                    </div>

                `;

                return;
            }


            notes.forEach(function(note) {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "note-card";


                card.innerHTML = `

                    <div
                        class="note-card-header"
                    >

                        <h3>
                            ${note.title}
                        </h3>

                        <button
                            onclick="deleteNote(${note.id})"
                        >
                            🗑️
                        </button>

                    </div>


                    <span
                        class="note-subject"
                    >
                        ${note.subject}
                    </span>


                    <p>
                        ${note.content}
                    </p>

                `;


                grid.appendChild(card);

            });

        })

        .catch(function(error) {

            console.error(
                "Notes loading error:",
                error
            );

        });
}


function deleteNote(id) {

    if (
        !confirm(
            "Delete this note?"
        )
    ) {
        return;
    }


    fetch(
        "/api/notes/" + id,
        {
            method: "DELETE"
        }
    )

    .then(function(response) {

        if (!response.ok) {

            throw new Error(
                "Delete failed"
            );

        }

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            alert(
                "Note deleted successfully! ✅"
            );

            displayNotes();

        }

    })

    .catch(function(error) {

        console.error(
            "Delete note error:",
            error
        );

        alert(
            "Note delete nahi ho payi."
        );

    });
}


document.addEventListener(
    "DOMContentLoaded",
    function() {

        displayNotes();

    }
);

/* =========================
   ATTENDANCE MODULE
========================= */

function saveAttendance() {

    const subject =
        document.getElementById("attendanceSubject").value.trim();

    const total =
        Number(document.getElementById("totalClasses").value);

    const attended =
        Number(document.getElementById("attendedClasses").value);

    if (!subject || total < 0 || attended < 0) {
        alert("Please enter valid attendance details.");
        return;
    }

    if (attended > total) {
        alert("Attended classes cannot be greater than total classes.");
        return;
    }

    fetch("/api/attendance", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body:
            "subject=" + encodeURIComponent(subject) +
            "&total_classes=" + encodeURIComponent(total) +
            "&attended_classes=" + encodeURIComponent(attended)
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {

        if (!data.success) {
            alert(data.message || "Attendance save nahi ho payi.");
            return;
        }

        document.getElementById("attendanceSubject").value = "";
        document.getElementById("totalClasses").value = "";
        document.getElementById("attendedClasses").value = "";

        hideAttendanceForm();

        displayAttendance();

    })
    .catch(function(error) {

        console.error("Error:", error);

        alert("Attendance save nahi ho payi.");

    });
}


function displayAttendance() {

    const grid = document.getElementById("attendanceGrid");

    if (!grid) {
        return;
    }

    fetch("/api/attendance")
        .then(function(response) {
            return response.json();
        })
        .then(function(attendance) {

            if (attendance.length === 0) {

                grid.innerHTML = `
                    <div class="empty-attendance">
                        <div>📅</div>

                        <h3>No subjects added</h3>

                        <p>
                            Add your subjects to track attendance.
                        </p>
                    </div>
                `;

                updateOverallAttendance();
                return;
            }

            grid.innerHTML = "";

            attendance.forEach(function(item) {

                const percentage =
                    item.total === 0
                        ? 0
                        : Math.round(
                            (item.attended / item.total) * 100
                        );

                const card = document.createElement("div");

                card.className = "attendance-card";

                card.innerHTML = `

                    <div class="attendance-card-header">

                        <h3>
                            ${item.subject}
                        </h3>

                        <button
                            onclick="deleteAttendance(${item.id})"
                        >
                            🗑️
                        </button>

                    </div>

                    <div class="attendance-percentage">
                        ${percentage}%
                    </div>

                    <div class="attendance-details">

                        <span>
                            Attended: ${item.attended}
                        </span>

                        <span>
                            Total: ${item.total}
                        </span>

                    </div>

                    <div class="attendance-bar">

                        <div style="width: ${percentage}%"></div>

                    </div>
                `;

                grid.appendChild(card);
            });

            updateOverallAttendance();

        })
        .catch(function(error) {

            console.error("Attendance loading error:", error);

        });
}


function updateOverallAttendance() {

    const grid =
        document.getElementById("attendanceGrid");

    const overall =
        document.getElementById("overallAttendance");

    if (!grid || !overall) {
        return;
    }


    const cards =
        grid.querySelectorAll(".attendance-card");


    if (cards.length === 0) {

        overall.textContent = "0%";

        return;
    }


    let totalClasses = 0;
    let attendedClasses = 0;


    cards.forEach(function(card) {

        const details =
            card.querySelector(".attendance-details");

        if (!details) {
            return;
        }


        const spans =
            details.querySelectorAll("span");


        let attended = 0;
        let total = 0;


        spans.forEach(function(span) {

            const text =
                span.textContent.trim();


            if (text.startsWith("Attended:")) {

                attended =
                    Number(
                        text.replace("Attended:", "").trim()
                    ) || 0;

            }


            if (text.startsWith("Total:")) {

                total =
                    Number(
                        text.replace("Total:", "").trim()
                    ) || 0;

            }

        });


        attendedClasses += attended;
        totalClasses += total;

    });


    const percentage =
        totalClasses === 0
            ? 0
            : Math.round(
                (attendedClasses / totalClasses) * 100
            );


    overall.textContent =
        percentage + "%";
}


function deleteAttendance(id) {

    if (!confirm("Delete this attendance record?")) {
        return;
    }

    fetch("/api/attendance/" + id, {
        method: "DELETE"
    })
    .then(function(response) {

        if (!response.ok) {
            throw new Error("Delete failed");
        }

        return response.json();

    })
    .then(function(data) {

        if (data.success) {
            alert("Attendance deleted successfully! ✅");
            displayAttendance();
        }

    })
    .catch(function(error) {

        console.error("Delete error:", error);
        alert("Attendance delete nahi ho payi.");

    });
}


document.addEventListener(
    "DOMContentLoaded",
    function() {

        displayAttendance();

    }
);

// ===============================
// MARKS & CGPA
// ===============================

function showMarksForm() {

    const form =
        document.getElementById("marksForm");

    if (form) {
        form.style.display = "block";
    }
}


function hideMarksForm() {

    const form =
        document.getElementById("marksForm");

    if (form) {
        form.style.display = "none";
    }
}


function saveMarks() {

    const subject =
        document
            .getElementById("marksSubject")
            .value
            .trim();

    const obtained =
        Number(
            document.getElementById("marksObtained").value
        );

    const total =
        Number(
            document.getElementById("marksTotal").value
        );

    const credits =
        Number(
            document.getElementById("marksCredits").value
        );


    if (
        !subject ||
        obtained < 0 ||
        total <= 0 ||
        credits <= 0
    ) {

        alert(
            "Please enter all marks details correctly."
        );

        return;
    }


    if (obtained > total) {

        alert(
            "Obtained marks cannot be greater than total marks."
        );

        return;
    }


    fetch("/api/marks", {

        method: "POST",

        headers: {
            "Content-Type":
                "application/x-www-form-urlencoded"
        },

        body:
            "subject=" +
            encodeURIComponent(subject) +

            "&marks_obtained=" +
            encodeURIComponent(obtained) +

            "&total_marks=" +
            encodeURIComponent(total) +

            "&credits=" +
            encodeURIComponent(credits)

    })

    .then(function(response) {

        if (!response.ok) {
            throw new Error("Failed to save marks");
        }

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            alert(
                "Marks saved successfully! ✅"
            );

            document
                .getElementById("marksSubject")
                .value = "";

            document
                .getElementById("marksObtained")
                .value = "";

            document
                .getElementById("marksTotal")
                .value = "";

            document
                .getElementById("marksCredits")
                .value = "";

            hideMarksForm();

            displayMarks();
        }

    })

    .catch(function(error) {

        console.error(
            "Marks save error:",
            error
        );

        alert(
            "Marks save nahi ho paye."
        );

    });
}


function displayMarks() {

    const grid =
        document.getElementById("marksGrid");

    if (!grid) {
        return;
    }


    fetch("/api/marks")

        .then(function(response) {

            if (!response.ok) {
                throw new Error(
                    "Failed to load marks"
                );
            }

            return response.json();

        })

        .then(function(marksData) {

            grid.innerHTML = "";


            if (marksData.length === 0) {

                grid.innerHTML = `

                    <div class="empty-marks">

                        <div>📊</div>

                        <h3>
                            No marks added
                        </h3>

                        <p>
                            Add your subject marks
                            to track performance.
                        </p>

                    </div>

                `;

                updateMarksSummary([]);

                return;
            }


            marksData.forEach(function(item) {

                const percentage =
                    item.total === 0
                        ? 0
                        : Math.round(
                            (item.obtained /
                            item.total) * 100
                        );


                const card =
                    document.createElement("div");

                card.className =
                    "marks-card";


                card.innerHTML = `

                    <div class="marks-card-header">

                        <h3>
                            ${item.subject}
                        </h3>

                        <button
                            onclick="deleteMarks(${item.id})"
                        >
                            🗑️
                        </button>

                    </div>


                    <div class="marks-percentage">

                        ${percentage}%

                    </div>


                    <p>

                        ${item.obtained}
                        /
                        ${item.total}
                        marks

                    </p>


                    <p>

                        Credits:
                        ${item.credits}

                    </p>


                    <div class="marks-bar">

                        <div
                            style="width: ${percentage}%"
                        ></div>

                    </div>

                `;


                grid.appendChild(card);

            });


            updateMarksSummary(marksData);

        })

        .catch(function(error) {

            console.error(
                "Marks loading error:",
                error
            );

        });
}


function deleteMarks(id) {

    if (
        !confirm(
            "Delete this marks record?"
        )
    ) {
        return;
    }


    fetch(
        "/api/marks/" + id,
        {
            method: "DELETE"
        }
    )

    .then(function(response) {

        if (!response.ok) {

            throw new Error(
                "Delete failed"
            );

        }

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            alert(
                "Marks deleted successfully! ✅"
            );

            displayMarks();

        }

    })

    .catch(function(error) {

        console.error(
            "Delete marks error:",
            error
        );

        alert(
            "Marks delete nahi ho paye."
        );

    });
}


function updateMarksSummary(marksData) {

    const averageElement =
        document.getElementById("averagePercentage");

    const sgpaElement =
        document.getElementById("estimatedSGPA");


    if (!averageElement || !sgpaElement) {
        return;
    }


    if (marksData.length === 0) {

        averageElement.textContent = "0%";
        sgpaElement.textContent = "0.00";

        return;
    }


    // =========================
    // AVERAGE PERCENTAGE
    // =========================

    let totalPercentage = 0;

    marksData.forEach(function(item) {

        if (item.total > 0) {

            totalPercentage +=
                (Number(item.obtained) /
                 Number(item.total)) * 100;

        }

    });


    const average =
        totalPercentage / marksData.length;


    averageElement.textContent =
        average.toFixed(2) + "%";


    // =========================
    // CREDIT BASED SGPA
    // =========================

    let totalCredits = 0;
    let totalGradePoints = 0;


    marksData.forEach(function(item) {

        const marksPercentage =
            (Number(item.obtained) /
             Number(item.total)) * 100;


        let gradePoint = 0;


        if (marksPercentage >= 90) {
            gradePoint = 10;
        }
        else if (marksPercentage >= 80) {
            gradePoint = 9;
        }
        else if (marksPercentage >= 70) {
            gradePoint = 8;
        }
        else if (marksPercentage >= 60) {
            gradePoint = 7;
        }
        else if (marksPercentage >= 50) {
            gradePoint = 6;
        }
        else if (marksPercentage >= 40) {
            gradePoint = 5;
        }
        else {
            gradePoint = 0;
        }


        const credits =
            Number(item.credits) || 0;


        totalCredits += credits;

        totalGradePoints +=
            gradePoint * credits;

    });


    let sgpa = 0;


    if (totalCredits > 0) {

        sgpa =
            totalGradePoints /
            totalCredits;

    }


    sgpaElement.textContent =
        sgpa.toFixed(2);

}



// Load Marks
if (
    document.getElementById("marksGrid")
) {

    displayMarks();

}

/* =========================
   GOALS MODULE
========================= */

function showGoalForm() {

    const form =
        document.getElementById("goalForm");

    if (form) {
        form.style.display = "block";
    }
}


function hideGoalForm() {

    const form =
        document.getElementById("goalForm");

    if (form) {
        form.style.display = "none";
    }
}


function saveGoal() {

    const title =
        document.getElementById("goalTitle").value.trim();

    const target =
        Number(
            document.getElementById("goalTarget").value
        );

    const progress =
        Number(
            document.getElementById("goalProgress").value
        ) || 0;


    if (!title || target <= 0 || progress < 0) {

        alert("Please enter valid goal details.");

        return;
    }


    if (progress > target) {

        alert("Progress cannot be greater than target.");

        return;
    }


    fetch("/api/goals", {

        method: "POST",

        headers: {
            "Content-Type":
                "application/x-www-form-urlencoded"
        },

        body:
            "title=" +
            encodeURIComponent(title) +

            "&target=" +
            encodeURIComponent(target) +

            "&progress=" +
            encodeURIComponent(progress)

    })

    .then(function(response) {

        if (!response.ok) {
            throw new Error("Failed to save goal");
        }

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            alert("Goal saved successfully! ✅");


            document.getElementById("goalTitle").value = "";

            document.getElementById("goalTarget").value = "";

            document.getElementById("goalProgress").value = "";


            hideGoalForm();

            displayGoals();

        }

    })

    .catch(function(error) {

        console.error(
            "Goal save error:",
            error
        );

        alert("Goal save nahi ho paya.");

    });
}


function displayGoals() {

    const grid =
        document.getElementById(
            "goalsGrid"
        );

    if (!grid) {
        return;
    }


    fetch("/api/goals")

        .then(function(response) {

            if (!response.ok) {

                throw new Error(
                    "Failed to load goals"
                );

            }

            return response.json();

        })

        .then(function(goals) {

            grid.innerHTML = "";


            if (goals.length === 0) {

                grid.innerHTML = `

                    <div class="empty-goals">

                        <div>🎯</div>

                        <h3>
                            No goals added
                        </h3>

                        <p>
                            Add your first study goal
                            to get started.
                        </p>

                    </div>

                `;

                return;
            }


            goals.forEach(function(goal) {

                const progress =
                    Math.min(
                        100,
                        Math.round(
                            (goal.progress /
                            goal.target) * 100
                        )
                    );


                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "goal-card";


                card.innerHTML = `

                    <div
                        class="goal-card-header"
                    >

                        <h3>
                            ${goal.title}
                        </h3>

                        <button
                            onclick="deleteGoal(${goal.id})"
                        >
                            🗑️
                        </button>

                    </div>


                    <div class="goal-progress">

                        <div
                            class="goal-progress-bar"
                        >

                            <div
                                style="
                                    width: ${progress}%;
                                "
                            ></div>

                        </div>

                    </div>


                    <p>
                        Progress:
                        ${goal.progress}
                        /
                        ${goal.target}
                    </p>


                    <p>
                        ${progress}% completed
                    </p>

                `;


                grid.appendChild(card);

            });

        })

        .catch(function(error) {

            console.error(
                "Goals loading error:",
                error
            );

        });
}


function deleteGoal(id) {

    if (
        !confirm(
            "Delete this goal?"
        )
    ) {
        return;
    }


    fetch(
        "/api/goals/" + id,
        {
            method: "DELETE"
        }
    )

    .then(function(response) {

        if (!response.ok) {

            throw new Error(
                "Delete failed"
            );

        }

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            alert(
                "Goal deleted successfully! ✅"
            );

            displayGoals();

        }

    })

    .catch(function(error) {

        console.error(
            "Delete goal error:",
            error
        );

        alert(
            "Goal delete nahi ho paya."
        );

    });
}


/* Load Goals */

if (
    document.getElementById("goalsGrid")
) {

    displayGoals();

}


// =====================================
// CSE SKILLS
// =====================================

function showSkillForm() {

    const form = document.getElementById("skillForm");

    if (form) {
        form.style.display = "block";
    }
}


function hideSkillForm() {

    const form = document.getElementById("skillForm");

    if (form) {
        form.style.display = "none";
    }
}


// =========================
// SAVE SKILL
// =========================

function saveSkill() {

    const name =
        document.getElementById("skillName").value.trim();

    const level =
        document.getElementById("skillLevel").value;


    if (!name || !level) {

        alert("Please enter skill name and select skill level.");

        return;
    }


    fetch("/api/skills", {

        method: "POST",

        headers: {
            "Content-Type":
                "application/x-www-form-urlencoded"
        },

        body:
            "name=" +
            encodeURIComponent(name) +

            "&level=" +
            encodeURIComponent(level)

    })

    .then(function(response) {

        if (!response.ok) {
            throw new Error("Failed to save skill");
        }

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            alert("Skill saved successfully! ✅");

            document.getElementById("skillName").value = "";
            document.getElementById("skillLevel").value = "";

            hideSkillForm();

            displaySkills();
        }

    })

    .catch(function(error) {

        console.error(
            "Skill save error:",
            error
        );

        alert("Skill save nahi ho payi.");

    });
}


// =========================
// DISPLAY SKILLS
// =========================

function displaySkills() {

    const grid =
        document.getElementById("skillsGrid");

    if (!grid) {
        return;
    }


    fetch("/api/skills")

        .then(function(response) {

            if (!response.ok) {
                throw new Error("Failed to load skills");
            }

            return response.json();

        })

        .then(function(skills) {

            grid.innerHTML = "";


            if (skills.length === 0) {

                grid.innerHTML = `
                    <div class="empty-skills">

                        <div>💻</div>

                        <h3>
                            No skills added
                        </h3>

                        <p>
                            Add your technical skills to track your progress.
                        </p>

                    </div>
                `;

                return;
            }


            skills.forEach(function(skill) {

                let percentage = 0;


                if (skill.level === "Beginner") {
                    percentage = 30;
                }

                else if (skill.level === "Intermediate") {
                    percentage = 65;
                }

                else if (skill.level === "Advanced") {
                    percentage = 90;
                }


                const card =
                    document.createElement("div");

                card.className = "skill-card";


                card.innerHTML = `

                    <div class="skill-card-header">

                        <h3>
                            ${skill.name}
                        </h3>

                        <button
                            onclick="deleteSkill(${skill.id})"
                        >
                            🗑️
                        </button>

                    </div>


                    <p class="skill-level">
                        ${skill.level}
                    </p>


                    <div class="skill-bar">

                        <div
                            style="width: ${percentage}%"
                        ></div>

                    </div>


                    <div class="skill-percentage">
                        ${percentage}%
                    </div>

                `;


                grid.appendChild(card);

            });

        })

        .catch(function(error) {

            console.error(
                "Skill loading error:",
                error
            );

        });
}


// =========================
// DELETE SKILL
// =========================

function deleteSkill(id) {

    if (!confirm("Delete this skill?")) {
        return;
    }


    fetch("/api/skills/" + id, {

        method: "DELETE"

    })

    .then(function(response) {

        if (!response.ok) {
            throw new Error("Delete failed");
        }

        return response.json();

    })

    .then(function(data) {

        if (data.success) {

            alert("Skill deleted successfully! ✅");

            displaySkills();

        }

    })

    .catch(function(error) {

        console.error(
            "Skill delete error:",
            error
        );

        alert("Skill delete nahi ho payi.");

    });
}


// =========================
// LOAD SKILLS
// =========================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        displaySkills();

    }
);


// =====================================
// ANALYTICS
// =====================================

async function loadAnalytics() {

    const subjectsElement =
        document.getElementById("analyticsSubjects");

    const notesElement =
        document.getElementById("analyticsNotes");

    const attendanceElement =
        document.getElementById("analyticsAttendance");

    const goalsElement =
        document.getElementById("analyticsGoals");

    const skillsElement =
        document.getElementById("analyticsSkills");

    const studyTimeElement =
        document.getElementById("analyticsStudyTime");

    const messageElement =
        document.getElementById("analyticsMessage");


    if (!subjectsElement) {
        return;
    }


    try {

        // =========================
        // LOAD ALL DATA
        // =========================

        const [
            subjectsResponse,
            notesResponse,
            attendanceResponse,
            goalsResponse,
            skillsResponse,
            sessionsResponse
        ] = await Promise.all([

            fetch("/api/subjects"),
            fetch("/api/notes"),
            fetch("/api/attendance"),
            fetch("/api/goals"),
            fetch("/api/skills"),
            fetch("/api/study-sessions")

        ]);


        if (
            !subjectsResponse.ok ||
            !notesResponse.ok ||
            !attendanceResponse.ok ||
            !goalsResponse.ok ||
            !skillsResponse.ok ||
            !sessionsResponse.ok
        ) {

            throw new Error(
                "Failed to load analytics data"
            );

        }


        const subjects =
            await subjectsResponse.json();

        const notes =
            await notesResponse.json();

        const attendanceData =
            await attendanceResponse.json();

        const goals =
            await goalsResponse.json();

        const skills =
            await skillsResponse.json();

        const studySessionsFromDB =
            await sessionsResponse.json();


        // =========================
        // SUBJECTS
        // =========================

        subjectsElement.textContent =
            subjects.length;


        // =========================
        // NOTES
        // =========================

        notesElement.textContent =
            notes.length;


        // =========================
        // ATTENDANCE
        // =========================

        let totalClasses = 0;
        let attendedClasses = 0;


        attendanceData.forEach(function(item) {

            totalClasses +=
                Number(item.total) || 0;

            attendedClasses +=
                Number(item.attended) || 0;

        });


        let attendance = 0;


        if (totalClasses > 0) {

            attendance =
                Math.round(
                    (attendedClasses /
                    totalClasses) * 100
                );

        }


        attendanceElement.textContent =
            attendance + "%";


        // =========================
        // GOALS
        // =========================

        goalsElement.textContent =
            goals.length;


        // =========================
        // SKILLS
        // =========================

        skillsElement.textContent =
            skills.length;


        // =========================
        // STUDY TIME
        // =========================

        const sessions =
            Array.isArray(studySessionsFromDB) ? studySessionsFromDB : [];


        const today =
            new Date()
                .toISOString()
                .split("T")[0];


        let studyMinutes = 0;


        sessions.forEach(function(session) {

            const sessionDate = session.date || session.study_date;
            const sessionType = session.session_type || session.type || "study";

            if (
                sessionDate === today &&
                sessionType === "study"
            ) {

                studyMinutes +=
                    Number(session.duration ?? session.minutes) || 0;

            }

        });


        if (studyTimeElement) {

            studyTimeElement.textContent =
                studyMinutes + " min";

        }


        // =========================
        // PERFORMANCE MESSAGE
        // =========================

        if (messageElement) {

            if (attendance >= 75) {

                messageElement.textContent =
                    "Great! Your attendance is on track. Keep maintaining your study routine.";

            }

            else if (attendance > 0) {

                messageElement.textContent =
                    "Your attendance is below 75%. Try to attend more classes.";

            }

            else {

                messageElement.textContent =
                    "Start adding your study data to see your progress here.";

            }

        }

    }

    catch (error) {

        console.error(
            "Analytics loading error:",
            error
        );

        if (messageElement) {

            messageElement.textContent =
                "Unable to load analytics data.";

        }

    }

}


// =========================
// LOAD ANALYTICS
// =========================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadAnalytics();

    }
);


// ================= PROFILE =================

function saveProfile() {

    const name = document.getElementById("profileNameInput").value.trim();
    const course = document.getElementById("profileCourseInput").value.trim();
    const college = document.getElementById("profileCollegeInput").value.trim();

    if (name === "" || course === "") {
        alert("Please enter Name and Course");
        return;
    }

    const profileData = {
        name: name,
        course: course,
        college: college
    };

    window.__studentProfile = profileData;
    fetch("/api/profile", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(profileData)});

    document.getElementById("profileName").textContent = name;
    document.getElementById("profileCourse").textContent = course;

    alert("Profile saved successfully! ✅");
}

// Load saved profile
function loadProfile() {

    fetch("/api/profile")
        .then(function(response) { return response.json(); })
        .then(function(rows) {

            const profile = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

            if (!profile) {
                return;
            }

            window.__studentProfile = profile;

            const nameInput = document.getElementById("profileNameInput");
            const courseInput = document.getElementById("profileCourseInput");
            const collegeInput = document.getElementById("profileCollegeInput");

            if (nameInput) {
                nameInput.value = profile.name || "";
            }

            if (courseInput) {
                courseInput.value = profile.course || "";
            }

            if (collegeInput) {
                collegeInput.value = profile.college || "";
            }

            const profileName = document.getElementById("profileName");
            const profileCourse = document.getElementById("profileCourse");

            if (profileName) {
                profileName.textContent = profile.name || "Student";
            }

            if (profileCourse) {
                profileCourse.textContent = profile.course || "B.Tech CSE";
            }

        })
        .catch(function(error) {
            console.error("Profile load error:", error);
        });
}

// Run profile loader when page opens
document.addEventListener("DOMContentLoaded", function () {
    loadProfile();
});

function showAttendanceForm() {
    document.getElementById("attendanceForm").style.display = "block";
}

function hideAttendanceForm() {
    document.getElementById("attendanceForm").style.display = "none";
}

/* =========================================================
   DASHBOARD (REAL, LIVE DATA)
========================================================= */

function formatDashboardDate(d) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return days[d.getDay()] + ", " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}

function dashboardWeekdayName(d) {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    // JS getDay(): 0=Sunday..6=Saturday -> convert to Monday-first index
    const jsDay = d.getDay();
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    return days[idx];
}

function minutesToHM(mins) {
    mins = Number(mins) || 0;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h + "h " + m + "m";
}

function dashboardGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
}

function guessScheduleTag(subjectName) {
    const s = (subjectName || "").toLowerCase();
    if (s.includes("project") || s.includes("web") || s.includes("app")) return "project";
    if (s.includes("dsa") || s.includes("code") || s.includes("coding") || s.includes("leetcode") || s.includes("program")) return "coding";
    return "study";
}

function renderDashScheduleTime(value) {
    if (!value) return "--:--";
    return value;
}

async function loadDashboard() {

    const scheduleList = document.getElementById("dashScheduleList");

    if (!scheduleList) {
        return; // not on dashboard page
    }

    // ---- Date / greeting (always accurate, client-side, never hardcoded) ----
    const now = new Date();

    const dateEl = document.getElementById("dashDate");
    if (dateEl) {
        dateEl.textContent = formatDashboardDate(now);
    }

    const greetingEl = document.getElementById("dashGreeting");
    if (greetingEl) {
        greetingEl.textContent = dashboardGreeting() + ", Student! 👋";
    }

    try {

        const response = await fetch("/api/dashboard-data");

        if (!response.ok) {
            throw new Error("Failed to load dashboard data");
        }

        const data = await response.json();

        // ---- Stat cards ----
        const studyEl = document.getElementById("statStudyTime");
        if (studyEl) studyEl.textContent = minutesToHM(data.stats.study_minutes_today);

        const codingEl = document.getElementById("statCodingTime");
        if (codingEl) codingEl.textContent = minutesToHM(data.stats.coding_minutes_today);

        const tasksEl = document.getElementById("statTasks");
        if (tasksEl) tasksEl.textContent = data.stats.completed_tasks + " / " + data.stats.total_tasks;

        const streakEl = document.getElementById("statStreak");
        if (streakEl) {
            const streak = data.stats.study_streak;
            streakEl.textContent = streak + (streak === 1 ? " Day" : " Days");
        }

        const streakSubEl = document.getElementById("statStreakSub");
        if (streakSubEl) {
            streakSubEl.textContent = data.stats.study_streak > 0 ? "Keep going!" : "Start today!";
        }

        // ---- Today's schedule ----
        renderDashSchedule(data.schedule, data.today_weekday);

        // ---- Today's tasks ----
        renderDashTasks(data.todays_tasks);

        // ---- Weekly progress chart ----
        renderDashWeeklyChart(data.weekly_progress, data.weekly_total_minutes);

        // ---- Overall progress ----
        const overallPct = data.overall_progress.overall;

        const overallEl = document.getElementById("dashOverallPercent");
        if (overallEl) overallEl.textContent = overallPct + "%";

        const circleEl = document.getElementById("dashProgressCircle");
        if (circleEl) {
            circleEl.style.background =
                "radial-gradient(circle, #181a38 57%, transparent 58%), " +
                "conic-gradient(#6c5ce7 " + overallPct + "%, #292c50 0)";
        }

        const academicEl = document.getElementById("dashAcademicPercent");
        if (academicEl) academicEl.textContent = data.overall_progress.academic + "%";

        const codingPctEl = document.getElementById("dashCodingPercent");
        if (codingPctEl) codingPctEl.textContent = data.overall_progress.coding + "%";

        const projectsEl = document.getElementById("dashProjectsPercent");
        if (projectsEl) projectsEl.textContent = data.overall_progress.projects + "%";

    } catch (error) {

        console.error("Dashboard load error:", error);

        scheduleList.innerHTML = '<p class="empty-hint">Could not load dashboard data. Please refresh.</p>';
    }
}


function renderDashSchedule(schedule, todayWeekday) {

    const list = document.getElementById("dashScheduleList");

    if (!list) return;

    if (!schedule || schedule.length === 0) {

        list.innerHTML =
            '<p class="empty-hint">No schedule planned for ' + todayWeekday + ' yet. Click "+ Add" to plan your day.</p>';

        return;
    }

    list.innerHTML = "";

    schedule.forEach(function(item) {

        const tag = (item.category && ["study","coding","project"].includes(item.category)) ? item.category : guessScheduleTag(item.subject);
        const tagLabel = tag.charAt(0).toUpperCase() + tag.slice(1);

        const row = document.createElement("div");
        row.className = "schedule-item";

        row.innerHTML =
            '<div class="time">' + renderDashScheduleTime(item.start_time) + '</div>' +
            '<div class="schedule-line"></div>' +
            '<div class="schedule-details">' +
                '<strong>' + item.subject + '</strong>' +
                '<span>' + (item.end_time ? "Until " + item.end_time : todayWeekday) + '</span>' +
            '</div>' +
            '<span class="schedule-tag ' + tag + '">' + tagLabel + '</span>';

        list.appendChild(row);

    });
}


function renderDashTasks(tasks) {

    const list = document.getElementById("dashTaskList");
    const subtitle = document.getElementById("dashTasksSubtitle");

    if (!list) return;

    if (!tasks || tasks.length === 0) {

        list.innerHTML = '<p class="empty-hint">No tasks for today.</p>';

        if (subtitle) subtitle.textContent = "0 of 0 completed";

        return;
    }

    const completedCount = tasks.filter(function(t) { return t.completed; }).length;

    if (subtitle) {
        subtitle.textContent = completedCount + " of " + tasks.length + " completed today";
    }

    list.innerHTML = "";

    tasks.forEach(function(task) {

        const label = document.createElement("label");
        label.className = "task-item" + (task.completed ? " completed" : "");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!task.completed;

        checkbox.addEventListener("change", function() {
            toggleDashboardTask(task.id, checkbox.checked, label);
        });

        const span = document.createElement("span");
        span.textContent = task.title + (task.subject ? " (" + task.subject + ")" : "");

        label.appendChild(checkbox);
        label.appendChild(span);

        list.appendChild(label);

    });
}


function toggleDashboardTask(id, completed, labelEl) {

    fetch("/api/tasks/" + id, {

        method: "PUT",

        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },

        body: "completed=" + (completed ? 1 : 0)

    })
    .then(function(response) {
        return response.json();
    })
    .then(function(result) {

        if (result.success) {

            if (labelEl) {
                labelEl.classList.toggle("completed", completed);
            }

            // Refresh full dashboard so stat cards / overall progress stay in sync
            loadDashboard();

        } else {
            alert("Task update nahi ho paya.");
        }

    })
    .catch(function(error) {
        console.error(error);
        alert("Task update nahi ho paya.");
    });
}


function renderDashWeeklyChart(weekly, totalMinutes) {

    const chart = document.getElementById("dashWeeklyChart");
    const totalEl = document.getElementById("dashWeeklyTotal");

    if (!chart) return;

    if (totalEl) {
        const hours = Math.round((Number(totalMinutes) || 0) / 60 * 10) / 10;
        totalEl.textContent = hours + "h";
    }

    if (!weekly || weekly.length === 0) {
        chart.innerHTML = '<p class="empty-hint">No study sessions logged this week yet.</p>';
        return;
    }

    const maxMinutes = Math.max.apply(null, weekly.map(function(d) { return d.minutes; }).concat([1]));

    chart.innerHTML = "";

    weekly.forEach(function(day) {

        const heightPct = Math.max(4, Math.round((day.minutes / maxMinutes) * 100));

        const column = document.createElement("div");
        column.className = "bar-column";

        const bar = document.createElement("div");
        bar.className = "bar" + (day.is_today ? " today" : "");
        bar.style.height = heightPct + "%";
        bar.title = day.label + ": " + minutesToHM(day.minutes);

        const label = document.createElement("span");
        label.textContent = day.label;

        column.appendChild(bar);
        column.appendChild(label);

        chart.appendChild(column);

    });
}


function addDashboardScheduleItem() {

    const subject = prompt("What's the activity/subject? (e.g. DSA Practice, DBMS Revision)");

    if (!subject || !subject.trim()) {
        return;
    }

    let startTime = prompt("Start time (24hr HH:MM, e.g. 09:00)", "09:00");

    if (startTime === null) {
        return;
    }

    startTime = startTime.trim();

    if (startTime && !/^\d{1,2}:\d{2}$/.test(startTime)) {
        alert("Please enter time in HH:MM format, e.g. 09:00");
        return;
    }

    let endTime = prompt("End time (24hr HH:MM, optional)", "");

    if (endTime === null) {
        endTime = "";
    }

    endTime = endTime.trim();

    if (endTime && !/^\d{1,2}:\d{2}$/.test(endTime)) {
        alert("Please enter time in HH:MM format, e.g. 10:00");
        return;
    }

    let category = prompt("Type: study, coding or project", "study");
    if (category === null) category = "study";
    category = category.trim().toLowerCase();
    if (!["study", "coding", "project"].includes(category)) {
        category = "study";
    }

    const today = new Date();
    const todayWeekday = dashboardWeekdayName(today);

    fetch("/api/timetable", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            day: todayWeekday,
            subject: subject.trim(),
            start_time: startTime,
            end_time: endTime,
            category: category
        })

    })
    .then(function(response) {
        return response.json();
    })
    .then(function(result) {

        if (result.success) {
            loadDashboard();
        } else {
            alert(result.error || "Schedule add nahi ho paya.");
        }

    })
    .catch(function(error) {
        console.error(error);
        alert("Schedule add nahi ho paya.");
    });
}


document.addEventListener("DOMContentLoaded", function() {
    loadDashboard();
});


/* =========================================================
   TIMETABLE PAGE (REAL, LIVE DATA)
========================================================= */

const TT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TT_DAY_SHORT = {Monday: "MON", Tuesday: "TUE", Wednesday: "WED", Thursday: "THU", Friday: "FRI", Saturday: "SAT", Sunday: "SUN"};

let ttAllItems = [];
let ttSelectedDay = null;
let ttWeekOffset = 0;

function ttTodayWeekday() {
    const jsDay = new Date().getDay();
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    return TT_DAYS[idx];
}

function ttGetWeekStart(offset) {
    const now = new Date();
    const jsDay = now.getDay();
    const mondayOffset = jsDay === 0 ? 6 : jsDay - 1;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
    monday.setDate(monday.getDate() + (offset * 7));
    return monday;
}

function ttIsSameDate(a, b) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function openTimetableForm() {
    const form = document.getElementById("timetableForm");
    if (!form) return;
    form.style.display = "block";
    form.classList.add("show");
    const daySelect = document.getElementById("ttDay");
    if (daySelect && ttSelectedDay) {
        daySelect.value = ttSelectedDay;
    }
}

function closeTimetableForm() {
    const form = document.getElementById("timetableForm");
    if (!form) return;
    form.style.display = "none";
    form.classList.remove("show");
}

function addTimetableItem() {

    const day = document.getElementById("ttDay").value;
    const subject = document.getElementById("ttSubject").value.trim();
    const start = document.getElementById("ttStart").value;
    const end = document.getElementById("ttEnd").value;
    const category = document.getElementById("ttCategory").value;

    if (!subject) {
        alert("Please enter an activity / subject name.");
        return;
    }

    if (!start) {
        alert("Please choose a start time.");
        return;
    }

    fetch("/api/timetable", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            day: day,
            subject: subject,
            start_time: start,
            end_time: end,
            category: category
        })

    })
    .then(function(response) {
        return response.json();
    })
    .then(function(result) {

        if (result.success) {

            document.getElementById("ttSubject").value = "";

            closeTimetableForm();

            ttSelectedDay = day;

            loadTimetablePage();

        } else {
            alert(result.error || "Schedule add nahi ho paya.");
        }

    })
    .catch(function(error) {
        console.error(error);
        alert("Schedule add nahi ho paya.");
    });
}

function deleteTimetableItem(id) {

    if (!confirm("Delete this schedule item?")) {
        return;
    }

    fetch("/api/timetable/" + id, {
        method: "DELETE"
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(result) {

        if (result.success) {
            loadTimetablePage();
        } else {
            alert("Schedule delete nahi ho paya.");
        }

    })
    .catch(function(error) {
        console.error(error);
        alert("Schedule delete nahi ho paya.");
    });
}

function ttTimeToMinutes(value) {
    if (!value || value.indexOf(":") === -1) return null;
    const parts = value.split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
}

function ttDurationMinutes(item) {
    const start = ttTimeToMinutes(item.start_time);
    const end = ttTimeToMinutes(item.end_time);
    if (start === null || end === null) return 0;
    let diff = end - start;
    if (diff < 0) diff += 24 * 60; // crosses midnight, unlikely but safe
    return diff;
}

function selectTimetableDay(day) {
    ttSelectedDay = day;
    renderTimetableWeekSelector();
    renderTimetableDay();
}

function renderTimetableWeekSelector() {

    const container = document.getElementById("timetableWeekSelector");

    if (!container) return;

    container.innerHTML = "";

    const prevBtn = document.createElement("button");
    prevBtn.className = "week-arrow";
    prevBtn.textContent = "‹";
    prevBtn.onclick = function() {
        ttWeekOffset -= 1;
        renderTimetableWeekSelector();
    };
    container.appendChild(prevBtn);

    const weekStart = ttGetWeekStart(ttWeekOffset);
    const today = new Date();

    TT_DAYS.forEach(function(day, i) {

        const cellDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
        const isToday = ttIsSameDate(cellDate, today);

        const el = document.createElement("div");
        el.className = "week-day" +
            (day === ttSelectedDay ? " active" : "") +
            (isToday ? " is-today" : "");
        el.onclick = function() { selectTimetableDay(day); };

        el.innerHTML =
            "<span>" + TT_DAY_SHORT[day] + "</span>" +
            "<strong>" + cellDate.getDate() + "</strong>";

        container.appendChild(el);

    });

    const nextBtn = document.createElement("button");
    nextBtn.className = "week-arrow";
    nextBtn.textContent = "›";
    nextBtn.onclick = function() {
        ttWeekOffset += 1;
        renderTimetableWeekSelector();
    };
    container.appendChild(nextBtn);
}

function renderTimetableDay() {

    const card = document.getElementById("timetableCard");

    if (!card) return;

    const items = ttAllItems
        .filter(function(i) { return i.day === ttSelectedDay; })
        .sort(function(a, b) {
            const am = ttTimeToMinutes(a.start_time);
            const bm = ttTimeToMinutes(b.start_time);
            return (am === null ? 9999 : am) - (bm === null ? 9999 : bm);
        });

    if (items.length === 0) {

        card.innerHTML =
            '<div class="time-row"><div class="schedule-box empty-box"><span>No schedule planned for ' +
            ttSelectedDay + ' yet. Click "+ Add Schedule" to plan it.</span></div></div>';

        return;
    }

    card.innerHTML = "";

    const categoryIcon = {study: "📚 Study", coding: "💻 Coding", project: "🚀 Project"};
    const categoryBoxClass = {study: "study-box", coding: "coding-box", project: "project-box"};

    items.forEach(function(item) {

        const category = ["study", "coding", "project"].includes(item.category) ? item.category : "study";

        const row = document.createElement("div");
        row.className = "time-row";

        row.innerHTML =
            '<div class="time-label">' + (item.start_time || "--:--") + '</div>' +
            '<div class="schedule-box ' + categoryBoxClass[category] + '">' +
                '<button class="tt-delete-btn" onclick="deleteTimetableItem(' + item.id + ')">×</button>' +
                '<strong>' + item.subject + '</strong>' +
                '<span>' + (item.end_time ? "Until " + item.end_time : item.day) + '</span>' +
                '<small>' + categoryIcon[category] + '</small>' +
            '</div>';

        card.appendChild(row);

    });
}

function renderTimetableSummary() {

    let studyMin = 0, codingMin = 0, projectMin = 0;

    ttAllItems.forEach(function(item) {

        const mins = ttDurationMinutes(item);
        const category = ["study", "coding", "project"].includes(item.category) ? item.category : "study";

        if (category === "study") studyMin += mins;
        else if (category === "coding") codingMin += mins;
        else if (category === "project") projectMin += mins;

    });

    const totalMin = studyMin + codingMin + projectMin;

    const studyEl = document.getElementById("ttSummaryStudy");
    const codingEl = document.getElementById("ttSummaryCoding");
    const projectEl = document.getElementById("ttSummaryProject");
    const totalEl = document.getElementById("ttSummaryTotal");

    if (studyEl) studyEl.textContent = minutesToHM(studyMin);
    if (codingEl) codingEl.textContent = minutesToHM(codingMin);
    if (projectEl) projectEl.textContent = minutesToHM(projectMin);
    if (totalEl) totalEl.textContent = minutesToHM(totalMin);
}

function loadTimetablePage() {

    const card = document.getElementById("timetableCard");

    if (!card) return; // not on timetable page

    if (!ttSelectedDay) {
        ttSelectedDay = ttTodayWeekday();
    }

    fetch("/api/timetable")
        .then(function(response) {
            return response.json();
        })
        .then(function(items) {

            ttAllItems = items || [];

            renderTimetableWeekSelector();
            renderTimetableDay();
            renderTimetableSummary();

        })
        .catch(function(error) {
            console.error("Timetable load error:", error);
            card.innerHTML = '<p class="empty-hint">Could not load timetable. Please refresh.</p>';
        });
}

document.addEventListener("DOMContentLoaded", function() {
    loadTimetablePage();
});


/* =========================================================
   LOGIN / REGISTER
========================================================= */

function showAuthError(elementId, message) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
}

function hideAuthError(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = "";
    el.classList.remove("show");
}

const loginFormEl = document.getElementById("loginForm");

if (loginFormEl) {

    loginFormEl.addEventListener("submit", function(event) {

        event.preventDefault();

        hideAuthError("loginError");

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!email || !password) {
            showAuthError("loginError", "Please enter both email and password.");
            return;
        }

        const btn = document.getElementById("loginBtn");
        if (btn) { btn.disabled = true; btn.textContent = "Logging in..."; }

        fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: password })
        })
        .then(function(response) {
            return response.json().then(function(data) {
                return { ok: response.ok, data: data };
            });
        })
        .then(function(result) {

            if (btn) { btn.disabled = false; btn.textContent = "Login"; }

            if (!result.ok) {
                showAuthError("loginError", result.data.error || "Invalid email or password.");
                return;
            }

            window.location.href = "/dashboard";

        })
        .catch(function(error) {
            console.error(error);
            if (btn) { btn.disabled = false; btn.textContent = "Login"; }
            showAuthError("loginError", "Login failed. Please try again.");
        });

    });

}

const registerFormEl = document.getElementById("registerForm");

if (registerFormEl) {

    registerFormEl.addEventListener("submit", function(event) {

        event.preventDefault();

        hideAuthError("registerError");

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const courseSelect = document.getElementById("course");
        const courseText = courseSelect && courseSelect.selectedIndex > 0
            ? courseSelect.options[courseSelect.selectedIndex].text
            : "";
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        if (!name || !email || !password || !confirmPassword) {
            showAuthError("registerError", "Please fill all required fields.");
            return;
        }

        if (password.length < 6) {
            showAuthError("registerError", "Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            showAuthError("registerError", "Passwords do not match.");
            return;
        }

        const btn = document.getElementById("registerBtn");
        if (btn) { btn.disabled = true; btn.textContent = "Creating account..."; }

        fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name, email: email, password: password })
        })
        .then(function(response) {
            return response.json().then(function(data) {
                return { ok: response.ok, data: data };
            });
        })
        .then(function(result) {

            if (!result.ok) {
                if (btn) { btn.disabled = false; btn.textContent = "Create Account"; }
                showAuthError("registerError", result.data.error || "Registration failed.");
                return;
            }

            // Save basic profile info too (best-effort, non-blocking)
            if (courseText) {
                fetch("/api/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: name, course: courseText, college: "" })
                }).catch(function() {});
            }

            window.location.href = "/login";

        })
        .catch(function(error) {
            console.error(error);
            if (btn) { btn.disabled = false; btn.textContent = "Create Account"; }
            showAuthError("registerError", "Registration failed. Please try again.");
        });

    });

}

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from pathlib import Path
import sqlite3
from datetime import date

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "database.db"

app = Flask(__name__)
app.config["SECRET_KEY"] = "change-this-secret-for-production"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Profile table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            course TEXT NOT NULL,
            college TEXT
        )
    """)

    # Attendance table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            total_classes INTEGER NOT NULL,
            attended_classes INTEGER NOT NULL
        )
    """)

    # Marks table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS marks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            marks_obtained REAL NOT NULL,
            total_marks REAL NOT NULL,
            credits REAL NOT NULL
        )
    """)

    # Subjects table
    cursor.execute("""
       CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            teacher TEXT,
            code TEXT
        )
    """)

    # Tasks table
    cursor.execute("""
       CREATE TABLE IF NOT EXISTS tasks (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           title TEXT NOT NULL,
           subject TEXT,
           due_date TEXT,
           completed INTEGER DEFAULT 0
        )
    """)

    # Notes table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            subject TEXT,
            content TEXT NOT NULL
        )
    """)

    # Goals table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            target INTEGER NOT NULL,
            progress INTEGER DEFAULT 0
        )
    """)

    # Skills table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            level TEXT NOT NULL
        )
    """)

    # Study sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS study_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            minutes INTEGER NOT NULL,
            study_date TEXT NOT NULL
        )
    """)

    cursor.execute("""CREATE TABLE IF NOT EXISTS dsa_problems (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, topic TEXT, difficulty TEXT, solved INTEGER DEFAULT 0)""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS timetable (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT NOT NULL, subject TEXT NOT NULL, start_time TEXT, end_time TEXT)""")
    cursor.execute("""CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL)""")
    # Safe migration for existing databases
    cols = [row[1] for row in cursor.execute("PRAGMA table_info(subjects)").fetchall()]
    if "credits" not in cols:
        cursor.execute("ALTER TABLE subjects ADD COLUMN credits REAL DEFAULT 0")

    session_cols = [row[1] for row in cursor.execute("PRAGMA table_info(study_sessions)").fetchall()]
    if "session_type" not in session_cols:
        cursor.execute("ALTER TABLE study_sessions ADD COLUMN session_type TEXT DEFAULT 'study'")

    timetable_cols = [row[1] for row in cursor.execute("PRAGMA table_info(timetable)").fetchall()]
    if "category" not in timetable_cols:
        cursor.execute("ALTER TABLE timetable ADD COLUMN category TEXT DEFAULT 'study'")

    dsa_cols = [row[1] for row in cursor.execute("PRAGMA table_info(dsa_problems)").fetchall()]
    if "solved_date" not in dsa_cols:
        cursor.execute("ALTER TABLE dsa_problems ADD COLUMN solved_date TEXT")

    subject_cols = [row[1] for row in cursor.execute("PRAGMA table_info(subjects)").fetchall()]
    if "completed" not in subject_cols:
        cursor.execute("ALTER TABLE subjects ADD COLUMN completed INTEGER DEFAULT 0")

    conn.commit()
    conn.close()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/register")
def register():
    return render_template("register.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/timetable")
def timetable():
    return render_template("timetable.html")


@app.route("/tasks")
def tasks():
    return render_template("tasks.html")

# =========================
# TASK API
# =========================

@app.route("/api/tasks", methods=["GET", "POST"])
def tasks_api():

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ADD TASK
    if request.method == "POST":

        title = request.form["title"]
        subject = request.form.get("subject", "")
        due_date = request.form.get("due_date", "")

        cursor.execute("""
            INSERT INTO tasks
            (title, subject, due_date, completed)
            VALUES (?, ?, ?, 0)
        """, (title, subject, due_date))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Task added successfully!"
        })

    # GET TASKS
    cursor.execute("""
        SELECT id, title, subject, due_date, completed
        FROM tasks
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()

    tasks_data = []

    for row in rows:
        tasks_data.append({
            "id": row[0],
            "title": row[1],
            "subject": row[2],
            "due_date": row[3],
            "completed": row[4]
        })

    return jsonify(tasks_data)


# DELETE TASK
@app.route("/api/tasks/<int:id>", methods=["DELETE"])
def delete_task(id):

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM tasks WHERE id = ?",
        (id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True
    })


# UPDATE TASK STATUS
@app.route("/api/tasks/<int:id>", methods=["PUT"])
def update_task(id):

    completed = int(request.form.get("completed", 0))

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE tasks
        SET completed = ?
        WHERE id = ?
    """, (completed, id))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True
    })


@app.route("/subjects")
def subjects():
    return render_template("subjects.html")

@app.route("/api/subjects", methods=["GET", "POST"])
def subjects_api():

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    if request.method == "POST":

        name = request.form["name"]
        teacher = request.form.get("teacher", "")
        code = request.form.get("code", "")
        credits = request.form.get("credits", 0) or 0

        try:
            credits = float(credits)
        except (TypeError, ValueError):
            credits = 0

        cursor.execute("""
            INSERT INTO subjects (name, teacher, code, credits)
            VALUES (?, ?, ?, ?)
        """, (name, teacher, code, credits))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Subject saved successfully!"
        })

    cursor.execute("""
        SELECT id, name, teacher, code, credits, completed
        FROM subjects
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()

    return jsonify([
        {
            "id": row[0],
            "name": row[1],
            "teacher": row[2],
            "code": row[3],
            "credits": row[4],
            "completed": row[5] or 0
        }
        for row in rows
    ])


@app.route("/api/subjects/<int:id>", methods=["DELETE", "PUT"])
def subject_item(id):

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    if request.method == "DELETE":

        cursor.execute(
            "DELETE FROM subjects WHERE id = ?",
            (id,)
        )

        conn.commit()
        conn.close()

        return jsonify({
            "success": True
        })

    # PUT: update existing subject (including credits)
    data = request.get_json(silent=True) or request.form

    name = data.get("name")
    teacher = data.get("teacher")
    code = data.get("code")
    credits = data.get("credits")

    if credits is not None:
        try:
            credits = float(credits)
        except (TypeError, ValueError):
            credits = None

    completed = data.get("completed")
    if completed is not None:
        completed = int(bool(completed))

    cursor.execute("""
        UPDATE subjects
        SET name = COALESCE(?, name),
            teacher = COALESCE(?, teacher),
            code = COALESCE(?, code),
            credits = COALESCE(?, credits),
            completed = COALESCE(?, completed)
        WHERE id = ?
    """, (name, teacher, code, credits, completed, id))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Subject updated successfully!"
    })


@app.route("/dsa")
def dsa():
    return render_template("dsa.html")

# =========================
# STUDY SESSIONS API
# =========================

@app.route("/api/study-sessions", methods=["GET", "POST"])
def study_sessions_api():

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # SAVE STUDY SESSION
    if request.method == "POST":

        data = request.get_json()

        minutes = int(data.get("minutes", 0))
        session_type = str(data.get("session_type", data.get("type", "study")) or "study").lower()
        if session_type not in ("study", "coding"):
            session_type = "study"

        if minutes <= 0:
            conn.close()
            return jsonify({
                "success": False,
                "message": "Invalid study time"
            }), 400

        from datetime import date

        study_date = date.today().isoformat()

        cursor.execute("""
            INSERT INTO study_sessions
            (minutes, study_date, session_type)
            VALUES (?, ?, ?)
        """, (
            minutes,
            study_date,
            session_type
        ))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "id": cursor.lastrowid,
            "minutes": minutes,
            "study_date": study_date,
            "session_type": session_type,
            "message": "Study session saved successfully!"
        }), 201

    # GET ALL SESSIONS
    cursor.execute("""
        SELECT id, minutes, study_date, session_type
        FROM study_sessions
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()

    sessions = []

    for row in rows:

        sessions.append({
            "id": row[0],
            "minutes": row[1],
            "study_date": row[2],
            "session_type": row[3] or "study"
        })

    return jsonify(sessions)


@app.route("/study-timer")
def study_timer():
    return render_template("study-timer.html")


@app.route("/notes")
def notes():
    return render_template("notes.html")

@app.route("/api/notes", methods=["GET", "POST"])
def notes_api():

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # SAVE NOTE
    if request.method == "POST":

        title = request.form["title"]
        subject = request.form["subject"]
        content = request.form["content"]

        cursor.execute("""
            INSERT INTO notes (title, subject, content)
            VALUES (?, ?, ?)
        """, (title, subject, content))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Note saved successfully!"
        })

    # GET NOTES
    cursor.execute("""
        SELECT id, title, subject, content
        FROM notes
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()

    notes_data = []

    for row in rows:

        notes_data.append({
            "id": row[0],
            "title": row[1],
            "subject": row[2],
            "content": row[3]
        })

    return jsonify(notes_data)


@app.route("/api/notes/<int:id>", methods=["DELETE"])
def delete_note(id):

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM notes WHERE id = ?",
        (id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True
    })


# =========================
# ATTENDANCE PAGE
# =========================

@app.route("/attendance")
def attendance():
    return render_template("attendance.html")


# =========================
# ATTENDANCE API
# =========================

@app.route("/api/attendance", methods=["GET", "POST"])
def attendance_api():

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ADD ATTENDANCE
    if request.method == "POST":

        subject = request.form["subject"]
        total_classes = int(request.form["total_classes"])
        attended_classes = int(request.form["attended_classes"])

        # Validation
        if total_classes <= 0:
            conn.close()
            return jsonify({
                "success": False,
                "message": "Total classes must be greater than 0"
            }), 400

        if attended_classes < 0 or attended_classes > total_classes:
            conn.close()
            return jsonify({
                "success": False,
                "message": "Invalid attended classes"
            }), 400

        cursor.execute("""
            INSERT INTO attendance
            (subject, total_classes, attended_classes)
            VALUES (?, ?, ?)
        """, (
            subject,
            total_classes,
            attended_classes
        ))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Attendance saved successfully!"
        })

    # GET ATTENDANCE
    cursor.execute("""
        SELECT
            id,
            subject,
            total_classes,
            attended_classes
        FROM attendance
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()

    attendance_data = []

    for row in rows:

        percentage = round(
            (row[3] / row[2]) * 100, 2
        )

        attendance_data.append({
            "id": row[0],
            "subject": row[1],
            "total": row[2],
            "attended": row[3],
            "percentage": percentage
        })

    return jsonify(attendance_data)


# =========================
# DELETE ATTENDANCE
# =========================

@app.route("/api/attendance/<int:id>", methods=["DELETE"])
def delete_attendance(id):

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM attendance WHERE id = ?",
        (id,)
    )

    conn.commit()

    deleted = cursor.rowcount

    conn.close()

    if deleted == 0:
        return jsonify({
            "success": False,
            "message": "Attendance not found"
        }), 404

    return jsonify({
        "success": True,
        "message": "Attendance deleted successfully!"
    })





@app.route("/marks")
def marks():
    return render_template("marks.html")

@app.route("/api/marks", methods=["GET", "POST"])
def marks_api():

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # SAVE MARKS
    if request.method == "POST":

        subject = request.form["subject"]
        marks_obtained = float(request.form["marks_obtained"])
        total_marks = float(request.form["total_marks"])
        credits = float(request.form["credits"])

        cursor.execute("""
            INSERT INTO marks
            (subject, marks_obtained, total_marks, credits)
            VALUES (?, ?, ?, ?)
        """, (
            subject,
            marks_obtained,
            total_marks,
            credits
        ))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Marks saved successfully!"
        })

    # GET MARKS
    cursor.execute("""
        SELECT
            id,
            subject,
            marks_obtained,
            total_marks,
            credits
        FROM marks
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()

    marks_data = []

    for row in rows:

        marks_data.append({
            "id": row[0],
            "subject": row[1],
            "obtained": row[2],
            "total": row[3],
            "credits": row[4]
        })

    return jsonify(marks_data)


@app.route("/api/marks/<int:id>", methods=["DELETE"])
def delete_marks(id):

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM marks WHERE id = ?",
        (id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True
    })


@app.route("/goals")
def goals():
    return render_template("goals.html")

@app.route("/api/goals", methods=["GET", "POST"])
def goals_api():

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # SAVE GOAL
    if request.method == "POST":

        title = request.form["title"]
        target = int(request.form["target"])
        progress = int(request.form.get("progress", 0))

        if progress < 0:
            progress = 0

        if progress > target:
            progress = target

        cursor.execute("""
            INSERT INTO goals (title, target, progress)
            VALUES (?, ?, ?)
        """, (title, target, progress))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Goal saved successfully!"
        })

    # GET GOALS
    cursor.execute("""
        SELECT id, title, target, progress
        FROM goals
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()

    goals_data = []

    for row in rows:

        goals_data.append({
            "id": row[0],
            "title": row[1],
            "target": row[2],
            "progress": row[3]
        })

    return jsonify(goals_data)


@app.route("/api/goals/<int:id>", methods=["DELETE"])
def delete_goal(id):

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM goals WHERE id = ?",
        (id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True
    })


@app.route("/skills")
def skills():
    return render_template("skills.html")

# =========================
# SKILLS API
# =========================

@app.route("/api/skills", methods=["GET", "POST"])
def skills_api():

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ADD SKILL
    if request.method == "POST":

        name = request.form["name"]
        level = request.form["level"]

        cursor.execute("""
            INSERT INTO skills (name, level)
            VALUES (?, ?)
        """, (name, level))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Skill saved successfully!"
        })

    # GET SKILLS
    cursor.execute("""
        SELECT id, name, level
        FROM skills
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    conn.close()

    skills_data = []

    for row in rows:

        skills_data.append({
            "id": row[0],
            "name": row[1],
            "level": row[2]
        })

    return jsonify(skills_data)


# DELETE SKILL
@app.route("/api/skills/<int:id>", methods=["DELETE"])
def delete_skill(id):

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM skills WHERE id = ?",
        (id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True
    })


@app.route("/analytics")
def analytics():
    return render_template("analytics.html")




def db_rows(query, params=()):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = [dict(r) for r in conn.execute(query, params).fetchall()]
    conn.close()
    return rows

@app.route("/api/dsa", methods=["GET", "POST"])
def dsa_api():
    if request.method == "GET":
        return jsonify(db_rows("SELECT * FROM dsa_problems ORDER BY id DESC"))
    data = request.get_json(silent=True) or request.form
    name = str(data.get("name", "")).strip()
    if not name: return jsonify(error="Problem name is required"), 400
    solved = int(bool(data.get("solved", 0)))
    solved_date = date.today().isoformat() if solved else None
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute("INSERT INTO dsa_problems(name,topic,difficulty,solved,solved_date) VALUES(?,?,?,?,?)", (name, data.get("topic",""), data.get("difficulty",""), solved, solved_date))
    conn.commit(); item = db_rows("SELECT * FROM dsa_problems WHERE id=?", (cur.lastrowid,))[0]; conn.close()
    return jsonify(item), 201

@app.route("/api/dsa/<int:id>", methods=["PUT", "DELETE"])
def dsa_item(id):
    conn = sqlite3.connect(DB_PATH)
    if request.method == "DELETE":
        cur = conn.execute("DELETE FROM dsa_problems WHERE id=?", (id,))
        conn.commit(); conn.close()
        return jsonify(success=cur.rowcount > 0)

    data = request.get_json(silent=True) or {}

    solved_value = data.get("solved")
    solved_date_param = None
    if solved_value is not None:
        solved_value = int(bool(solved_value))
        solved_date_param = date.today().isoformat() if solved_value else None
        conn.execute(
            "UPDATE dsa_problems SET name=COALESCE(?,name), topic=COALESCE(?,topic), difficulty=COALESCE(?,difficulty), solved=?, solved_date=? WHERE id=?",
            (data.get("name"), data.get("topic"), data.get("difficulty"), solved_value, solved_date_param, id)
        )
        cur = conn
    else:
        cur = conn.execute(
            "UPDATE dsa_problems SET name=COALESCE(?,name), topic=COALESCE(?,topic), difficulty=COALESCE(?,difficulty) WHERE id=?",
            (data.get("name"), data.get("topic"), data.get("difficulty"), id)
        )
    conn.commit()
    item = db_rows("SELECT * FROM dsa_problems WHERE id=?", (id,))
    conn.close()
    return jsonify(success=bool(item), problem=(item[0] if item else None))

@app.route("/api/timetable", methods=["GET", "POST"])
def timetable_api():
    if request.method == "GET": return jsonify(db_rows("SELECT * FROM timetable ORDER BY day, start_time ASC, id ASC"))
    data = request.get_json(silent=True) or request.form
    if not str(data.get("day","")).strip() or not str(data.get("subject","")).strip(): return jsonify(error="Day and subject are required"),400
    category = str(data.get("category", "study") or "study").lower()
    if category not in ("study", "coding", "project"):
        category = "study"
    conn=sqlite3.connect(DB_PATH); cur=conn.execute("INSERT INTO timetable(day,subject,start_time,end_time,category) VALUES(?,?,?,?,?)",(data.get("day"),data.get("subject"),data.get("start_time",data.get("startTime","")),data.get("end_time",data.get("endTime","")),category)); conn.commit(); conn.close()
    return jsonify(id=cur.lastrowid, success=True),201

@app.route("/api/timetable/<int:id>", methods=["DELETE"])
def delete_timetable(id):
    conn=sqlite3.connect(DB_PATH); cur=conn.execute("DELETE FROM timetable WHERE id=?",(id,)); conn.commit(); conn.close(); return jsonify(success=cur.rowcount>0)

@app.route("/api/profile", methods=["GET", "POST"])
def profile_api():
    if request.method == "GET": return jsonify(db_rows("SELECT * FROM profile ORDER BY id DESC LIMIT 1"))
    data=request.get_json(silent=True) or request.form
    name=str(data.get("name","")).strip(); course=str(data.get("course","")).strip(); college=str(data.get("college","")).strip()
    if not name or not course: return jsonify(error="Name and course are required"),400
    conn=sqlite3.connect(DB_PATH); conn.execute("DELETE FROM profile"); conn.execute("INSERT INTO profile(name,course,college) VALUES(?,?,?)",(name,course,college)); conn.commit(); conn.close(); return jsonify(success=True)

@app.route("/api/dashboard-stats")
def dashboard_stats():
    conn=sqlite3.connect(DB_PATH); c=conn.cursor()
    tasks=c.execute("SELECT COUNT(*), COALESCE(SUM(completed),0) FROM tasks").fetchone(); subjects=c.execute("SELECT COUNT(*) FROM subjects").fetchone()[0]; dsa=c.execute("SELECT COUNT(*),COALESCE(SUM(solved),0) FROM dsa_problems").fetchone(); today=date.today().isoformat(); minutes=c.execute("SELECT COALESCE(SUM(minutes),0) FROM study_sessions WHERE study_date=?",(today,)).fetchone()[0]; conn.close()
    return jsonify(total_tasks=tasks[0], completed_tasks=tasks[1], pending_tasks=tasks[0]-tasks[1], total_subjects=subjects, total_dsa=dsa[0], solved_dsa=dsa[1], today_minutes=minutes)


# =========================
# DASHBOARD (REAL DATA)
# =========================

@app.route("/api/dashboard-data")
def dashboard_data():
    import datetime as _dt

    today_obj = date.today()
    today = today_obj.isoformat()
    weekday_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    today_weekday = weekday_names[today_obj.weekday()]

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # ---- Study / coding minutes today ----
    study_today = c.execute(
        "SELECT COALESCE(SUM(minutes),0) FROM study_sessions WHERE study_date=? AND session_type='study'",
        (today,)
    ).fetchone()[0]
    coding_today = c.execute(
        "SELECT COALESCE(SUM(minutes),0) FROM study_sessions WHERE study_date=? AND session_type='coding'",
        (today,)
    ).fetchone()[0]

    # ---- Tasks ----
    total_tasks, completed_tasks = c.execute(
        "SELECT COUNT(*), COALESCE(SUM(completed),0) FROM tasks"
    ).fetchone()

    todays_tasks = [dict(r) for r in c.execute(
        "SELECT id, title, subject, due_date, completed FROM tasks WHERE due_date=? ORDER BY completed ASC, id DESC",
        (today,)
    ).fetchall()]

    # ---- Today's schedule (from timetable, matched to today's weekday) ----
    schedule = [dict(r) for r in c.execute(
        "SELECT id, day, subject, start_time, end_time, category FROM timetable WHERE day=? ORDER BY start_time ASC, id ASC",
        (today_weekday,)
    ).fetchall()]

    # ---- Study streak: consecutive days (ending today or yesterday) with any minutes logged ----
    session_dates = set(row[0] for row in c.execute(
        "SELECT DISTINCT study_date FROM study_sessions"
    ).fetchall())

    streak = 0
    cursor_day = today_obj
    if today not in session_dates:
        cursor_day = today_obj - _dt.timedelta(days=1)
    while cursor_day.isoformat() in session_dates:
        streak += 1
        cursor_day -= _dt.timedelta(days=1)

    # ---- Weekly study progress (Mon-Sun of current week) ----
    week_start = today_obj - _dt.timedelta(days=today_obj.weekday())
    weekly = []
    for i in range(7):
        d = week_start + _dt.timedelta(days=i)
        d_iso = d.isoformat()
        total_min = c.execute(
            "SELECT COALESCE(SUM(minutes),0) FROM study_sessions WHERE study_date=? AND session_type='study'",
            (d_iso,)
        ).fetchone()[0]
        weekly.append({
            "label": weekday_names[i][:3],
            "date": d_iso,
            "minutes": total_min,
            "is_today": d_iso == today
        })

    weekly_total_minutes = sum(day["minutes"] for day in weekly)

    # ---- Overall progress ----
    attendance_rows = c.execute("SELECT total_classes, attended_classes FROM attendance").fetchall()
    total_classes = sum(r[0] for r in attendance_rows)
    attended_classes = sum(r[1] for r in attendance_rows)
    academic_pct = round((attended_classes / total_classes) * 100) if total_classes > 0 else 0

    dsa_total, dsa_solved = c.execute(
        "SELECT COUNT(*), COALESCE(SUM(solved),0) FROM dsa_problems"
    ).fetchone()
    coding_pct = round((dsa_solved / dsa_total) * 100) if dsa_total > 0 else 0

    projects_pct = round((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0

    parts = [p for p in [academic_pct if total_classes > 0 else None,
                          coding_pct if dsa_total > 0 else None,
                          projects_pct if total_tasks > 0 else None] if p is not None]
    overall_pct = round(sum(parts) / len(parts)) if parts else 0

    conn.close()

    return jsonify({
        "today": today,
        "today_weekday": today_weekday,
        "stats": {
            "study_minutes_today": study_today,
            "coding_minutes_today": coding_today,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "study_streak": streak
        },
        "todays_tasks": todays_tasks,
        "schedule": schedule,
        "weekly_progress": weekly,
        "weekly_total_minutes": weekly_total_minutes,
        "overall_progress": {
            "overall": overall_pct,
            "academic": academic_pct,
            "coding": coding_pct,
            "projects": projects_pct
        }
    })

@app.route("/api/register", methods=["POST"])
def api_register():
    data=request.get_json(silent=True) or request.form; name=str(data.get("name","")).strip(); email=str(data.get("email","")).strip().lower(); password=str(data.get("password",""))
    if not name or not email or len(password)<6: return jsonify(error="Name, valid email and password of at least 6 characters are required"),400
    conn=sqlite3.connect(DB_PATH)
    try: conn.execute("INSERT INTO users(name,email,password_hash) VALUES(?,?,?)",(name,email,generate_password_hash(password))); conn.commit()
    except sqlite3.IntegrityError: conn.close(); return jsonify(error="Email already registered"),409
    conn.close(); return jsonify(success=True),201

@app.route("/api/login", methods=["POST"])
def api_login():
    data=request.get_json(silent=True) or request.form; email=str(data.get("email","")).strip().lower(); password=str(data.get("password","")); row=db_rows("SELECT * FROM users WHERE email=?",(email,))
    if not row or not check_password_hash(row[0]["password_hash"],password): return jsonify(error="Invalid email or password"),401
    session["user_id"]=row[0]["id"]; session["user_name"]=row[0]["name"]; return jsonify(success=True, user={"id":row[0]["id"],"name":row[0]["name"],"email":row[0]["email"]})

@app.route("/api/logout", methods=["POST", "GET"])
def api_logout():
    session.clear()
    if request.method == "POST":
        return jsonify(success=True)
    return redirect(url_for("home"))

@app.route("/profile", methods=["GET", "POST"])
def profile():

    if request.method == "POST":

        name = request.form["name"]
        course = request.form["course"]
        college = request.form["college"]

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("DELETE FROM profile")

        cursor.execute("""
            INSERT INTO profile (name, course, college)
            VALUES (?, ?, ?)
        """, (name, course, college))

        conn.commit()
        conn.close()

        return jsonify(success=True, message="Profile saved successfully!")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM profile ORDER BY id DESC LIMIT 1")
    profile_data = cursor.fetchone()

    conn.close()

    return render_template("profile.html", profile=profile_data)
    

init_db()

if __name__ == "__main__":
    app.run(debug=True)
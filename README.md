# HRMS Pro | Ethara.AI Assessment

A Full-Stack Human Resource Management System built for the Ethara.AI LLM Intern Assessment.
This application allows administrators to manage employee records, track daily attendance, and visualize workforce statistics in real-time.

**Live Application:** [https://hrms-ethara-assessment.vercel.app](https://hrms-ethara-assessment.vercel.app)  
**Backend API:** [https://hrms-backend-crtf.onrender.com](https://hrms-backend-crtf.onrender.com)

## 🚀 Tech Stack
* **Frontend:** React.js (Vite), Tailwind CSS, Lucide React (Icons), Axios
* **Backend:** Python (FastAPI), SQLAlchemy, Uvicorn
* **Database:** SQLite (Persistent storage)
* **Deployment:** Vercel (Frontend) + Render (Backend)

## ✨ Key Features
1.  **Employee Management:** Add, view, and delete employee records.
2.  **Attendance Tracking:** Mark employees as Present/Absent with instant visual feedback (Toast notifications).
3.  **Data Persistence:** All data is saved reliably in a relational database.
4.  **Analytics Dashboard:** Real-time view of total staff, daily attendance, and department distribution.
5.  **Activity Logging:** Tracks timestamps for all attendance actions.

## 🛠️ Setup Instructions (Local)
To run this project locally:

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/ritul-aryan/hrms-ethara-assessment.git](https://github.com/ritul-aryan/hrms-ethara-assessment.git)
    ```
2.  **Backend Setup**
    ```bash
    cd backend
    pip install -r requirements.txt
    python -m uvicorn main:app --reload
    ```
3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## 🧠 Design Decisions
* **FastAPI:** Chosen for its high performance and native support for asynchronous operations, making it ideal for future AI/LLM integrations.
* **SQLite:** Selected for this assessment to ensure a lightweight, self-contained database without external dependencies.

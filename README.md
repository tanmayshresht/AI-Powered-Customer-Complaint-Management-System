Markdown
<div align="center">

# 🚀 AI-Powered Customer Complaint Management System
### *API & FDF Quality Assurance (QMS) Module*

<p align="center">
  <img src="https://img.shields.io/badge/Status-Completed-success?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Tech-React_%7C_Redux_%7C_FastAPI-blue?style=for-the-badge" alt="Tech Stack">
  <img src="https://img.shields.io/badge/AI-LangGraph_%7C_Groq_Gemma2-orange?style=for-the-badge" alt="AI Engine">
</p>

</div>

---

## 📌 Overview
An intelligent, automated **Customer Complaint Management System** tailored for the pharmaceutical manufacturing industry (API & FDF Quality Management Systems). The platform features an AI-powered intake assistant that parses unstructured documents (PDF, TXT, DOCX, EML) or raw emails, extracts critical attributes via **LangGraph & Groq LLMs**, and automatically populates compliance triage forms.

## 🌍 Live Website
**LIVE WEBSITE** :- https://ai-powered-customer-complaint-man-tan.vercel.app

---

## 🛠️ Tech Stack

* **Frontend:** React, Redux (State Management), Google Inter Font, Tailwind CSS/Styling
* **Backend:** Python, FastAPI, LangGraph Agent Framework
* **AI / LLM:** Groq API (`gemma2-9b-it` / `llama-3.3-70b-versatile`)
* **Database:** PostgreSQL / MySQL (via SQLAlchemy)

---

## ✨ Key Features

* 📄 **AI Complaint Intake Assistant:** Drag-and-drop or paste raw complaint text/documents to instantly extract key fields.
* 🤖 **Agentic Workflow:** Powered by LangGraph to structure and validate extraction processes.
* 📋 **Comprehensive Triage Form:** Automatically fills out Origin & Customer Details, Product & Batch Identification, Complaint Details, and Initial Assessment & Priority.
* ⚡ **Real-time Progress Tracker:** Visual feedback during document analysis and field extraction.

---

## 🚀 Getting Started Locally

Follow these steps to set up and run the project on your local machine.

### 1. Clone the Repository
```bash
git clone [https://github.com/tanmayshresht/AI-Powered-Customer-Complaint-Management-System.git](https://github.com/tanmayshresht/AI-Powered-Customer-Complaint-Management-System.git)
cd AI-Powered-Customer-Complaint-Management-System
2. Backend Setup (FastAPI)
Navigate to the backend directory, create a virtual environment, and install dependencies:

Bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
Set up your environment variables (create a .env file based on .env.example with your Groq and Database credentials), then start the FastAPI server:

Bash
uvicorn main:app --reload --port 8000
3. Frontend Setup (React)
Open a new terminal window, return to the root directory, and run the frontend:

Bash
npm install
npm run dev
Open your browser and navigate to http://localhost:5173 to access the application.


📝 License
This project is built for the AIVOA AI Product Engineer (Interns) assignment evaluation.


---

```bash
git add README.md
git commit -m "Enhance README with a stylish, professional template"
git push origin main

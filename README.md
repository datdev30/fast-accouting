# FastAccounting

FastAccounting is a web-based accounting application featuring a React frontend and a Python/FastAPI backend, designed to manage customers, transactions, and generate reports.

## Prerequisites

Before running this project, ensure you have the following installed:

-   **Python 3.8+**: [Download Python](https://www.python.org/downloads/) (Ensure it's added to your PATH).
-   **Node.js 16+**: [Download Node.js](https://nodejs.org/) (Includes npm).
-   **MongoDB**: [Download MongoDB Community Server](https://www.mongodb.com/try/download/community). Ensure the MongoDB service is running locally on port `27017`.

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/realthdat/FastAccounting.git
    cd FastAccounting
    ```

2.  **Backend Setup (Server):**

    Navigate to the `server` directory, create a virtual environment, and install dependencies.

    ```bash
    cd server
    # Create virtual environment
    python -m venv venv

    # Activate virtual environment
    # Windows:
    .\venv\Scripts\activate
    # Linux/Mac:
    # source venv/bin/activate

    # Install dependencies
    pip install -r requirements.txt
    ```

    Create a `.env` file in the `server` directory (optional if using default local MongoDB):

    ```env
    MONGODB_URL=mongodb://localhost:27017/fastaccounting
    SECRET_KEY=your_secret_key_here
    # Add other environment variables as needed
    ```

3.  **Frontend Setup (Client):**

    Navigate to the `client` directory and install dependencies.

    ```bash
    cd ../client
    npm install
    ```

## Running the Application

### Windows (Quick Start)

You can use the provided batch script to start both the backend and frontend:

```bash
Double-click `start_app.bat`
```

### Manual Start

1.  **Start the Backend:**

    Open a terminal in the `server` directory:

    ```bash
    # Ensure venv is activated
    .\venv\Scripts\activate
    uvicorn main:app --reload --port 8000
    ```

2.  **Start the Frontend:**

    Open a new terminal in the `client` directory:

    ```bash
    npm run dev
    ```

    The application should be accessible at `http://localhost:5173` (or the port shown in the terminal).

## Building Executable

To build a standalone `.exe` for Windows:

1.  Navigate to the `server` directory.
2.  Run the build script:

    ```bash
    build_exe.bat
    ```

This will generate the executable in the `dist` folder. Note that you may need to bundle the `client` build first by running `npm run build` in the `client` directory before packaging.

## Features

-   Customer Management
-   Transaction Tracking
-   Interest & Debt Calculation
-   PDF Report Generation
-   Analytics Dashboard

# Are You Meme?

A fun project that matches your face and pose to popular memes using AI. Quickly find the meme that best represents your expression and share it with friends.


1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Create a virtual environment** (if it doesn’t already exist)
   ```bash
   python -m venv .venv
   ```

3. **Activate the virtual environment**
   ```bash
   source .venv/bin/activate
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the embedding generation script**
   ```bash
   python scripts/generate_embeddings.py
   ```

## To start the server
1. Change to the backend directory and activate the virtual environment:
   ```bash
   cd backend
   source .venv/bin/activate
   ```
2. Run the FastAPI app with Uvicorn:
   ```bash
   uvicorn app:app --reload --host 127.0.0.1 --port 8000
   ```

## To run the frontend
1. Change to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies if you haven't already:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
The frontend will be accessible at `http://localhost:5173` by default.
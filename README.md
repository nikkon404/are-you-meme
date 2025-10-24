# Are You Meme?

A fun project that matches your face and pose to popular memes using AI. Quickly find the meme that best represents your expression and share it with friends.


## To run the embedding generation script
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Ensure the `models` directory exists and contains the `clip_encoder.py` file.
3. Run the embedding generation script with the appropriate Python path:
    ```bash
    source .venv/bin/activate && PYTHONPATH=$PYTHONPATH:. .venv/bin/python3 scripts generate_embeddings.py
    ```
    or simply
    ```bash
    PYTHONPATH=$PYTHONPATH:. python scripts/generate_embeddings.py
    ```
  



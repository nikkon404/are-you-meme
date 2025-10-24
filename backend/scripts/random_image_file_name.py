import os
import random
import string


def generate_random_string(length=6):
    """Generate a random string of fixed length."""
    letters_and_digits = string.ascii_letters + string.digits
    return "".join(random.choice(letters_and_digits) for i in range(length))


def rename_files_in_folder(folder_path):
    """Rename all files in the folder to random 6-character names while preserving extensions."""
    try:
        # Get all files in the directory
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)

            if os.path.isfile(file_path):  # Only rename files (ignore subfolders)
                # Split the filename and its extension
                name, ext = os.path.splitext(filename)
                # Generate a random 6-character string
                random_name = generate_random_string() + ext
                # Construct the new file path
                new_file_path = os.path.join(folder_path, random_name)

                # Rename the file
                os.rename(file_path, new_file_path)
                print(f"Renamed: {filename} -> {random_name}")

    except Exception as e:
        print(f"Error: {e}")


# Example usage:
folder_path = input("Enter the path to the folder: ")
rename_files_in_folder(folder_path)

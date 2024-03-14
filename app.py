from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
import requests
from flask_migrate import Migrate

app = Flask(__name__)
app.secret_key = (
    "de4c977ae2545cab6cd35f1ec837c12d"  # Change this to your actual secret key
)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"  # SQLite database file
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False  # Disable modification tracking
db = SQLAlchemy(app)
migrate = Migrate(app, db)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    images = db.relationship("Image", backref="user", lazy=True)
    prompts = db.relationship("Prompt", backref="user", lazy=True)
    responses = db.relationship("Response", backref="user", lazy=True)


class Image(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)


class Prompt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    responses = db.relationship("Response", backref="prompt", lazy=True)


class Response(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    prompt_id = db.Column(db.Integer, db.ForeignKey("prompt.id"), nullable=False)
    sentiment = db.Column(
        db.Boolean, nullable=False
    )  # True for positive, False for negative


# Create the database tables (only needed once)
with app.app_context():
    db.create_all()


@app.route("/")
def index():
    if "username" in session:
        return render_template("index.html")
    else:
        return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        user = User.query.filter_by(username=username, password=password).first()
        if user:
            session["username"] = username
            return redirect(url_for("index"))
        else:
            return render_template("login.html", error="Invalid username or password")
    return render_template("login.html", error=None)


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return render_template("signup.html", error="Username already exists")
        else:
            new_user = User(username=username, password=password)
            db.session.add(new_user)
            db.session.commit()
            session["username"] = username
            return redirect(url_for("index"))
    return render_template("signup.html", error=None)


@app.route("/logout")
def logout():
    session.pop("username", None)
    return redirect(url_for("index"))


@app.route("/generate_story", methods=["POST"])
def generate_story():
    if "username" not in session:
        return jsonify({"error": "Unauthorized access"}), 401

    api_key = "AIzaSyDORYHYuu-A9cvP6HWe5IHkU0MmItgYWUQ"  # Replace with your actual Google Cloud API key
    api_url = (
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key="
        + api_key
    )
    try:

        request_data = request.json
        response = requests.post(api_url, json=request_data)
        response_data = response.json()

        # user = User.query.filter_by(username=session["username"]).first()
        # if user:
        #     try:
        #         # Store prompt and response in the database
        #         prompt = Prompt(
        #             content=request_data["contents"][0]["parts"][0]["text"],
        #             user_id=user.id,
        #         )
        #         response = Response(
        #             content=response_data["candidates"][0]["content"]["parts"][0][
        #                 "text"
        #             ],
        #             user_id=user.id,
        #         )
        #         db.session.add(prompt)
        #         db.session.add(response)
        #         db.session.commit()
        #         # commit the data to the database
        #         print("Prompt and response stored in the database")
        #     except Exception as e:
        #         db.session.rollback()  # Rollback changes if an error occurs
        #         return jsonify({"error": "Database error: " + str(e)}), 500

        return jsonify(response_data)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Request error: " + str(e)}), 500
    except Exception as e:
        return jsonify({"error": "Unexpected error: " + str(e)}), 500
    finally:
        db.session.close()  # Always close the session after each request


@app.route("/submit_user_response", methods=["POST"])
def submit_user_response():
    if "username" not in session:
        return jsonify({"error": "Unauthorized access"}), 401

    try:
        request_data = request.json
        user = User.query.filter_by(username=session["username"]).first()
        if user:
            try:
                # Store user response in the database
                prompt = Prompt(
                    content=request_data["prompt"],
                    user_id=user.id,
                )

                db.session.add(prompt)
                db.session.commit()

                print("prompt created", prompt.id, prompt.content, prompt.user_id)

                selectedResponse = Response(
                    content=request_data["selectedResponse"],
                    user_id=user.id,
                    prompt_id=prompt.id,
                    sentiment=request_data["selectedSentiment"],
                )

                db.session.add(selectedResponse)
                db.session.commit()

                otherResponse = Response(
                    content=request_data["otherResponse"],
                    user_id=user.id,
                    prompt_id=prompt.id,
                    sentiment=request_data["otherSentiment"],
                )

                db.session.add(otherResponse)
                db.session.commit()

                # commit the data to the database
                print("User response stored in the database")
            except Exception as e:
                db.session.rollback()  # Rollback changes if an error occurs
                return jsonify({"error": "Database error: " + str(e)}), 500

        return jsonify({"message": "success"})
    except Exception as e:
        return jsonify({"error": "Unexpected error: " + str(e)}), 500
    finally:
        db.session.close()


if __name__ == "__main__":
    app.run(debug=True)

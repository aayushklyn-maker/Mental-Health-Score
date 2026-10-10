# Student Mental Health Score Predictor

A machine-learning web app that estimates a student's mental health score from lifestyle, study, stress, and social media usage information. The project includes a static web interface, a FastAPI prediction service, a trained scikit-learn model, a dataset, and a Jupyter notebook for data exploration and model training.

> **For educational use only.** This model is not a medical or psychological assessment, diagnosis, or substitute for professional support.

## Features

- Collects student demographics, academic level, social media habits, sleep, activity, study time, and stress level.
- Returns an estimated score out of 10 using a trained regression pipeline.
- Validates incoming prediction data with Pydantic.
- Presents the prediction in a responsive web interface.

## Project Files

| File | Description |
| --- | --- |
| `index.html`, `style.css`, `script.js` | Browser-based prediction form and results view |
| `main.py` | FastAPI application and `/predict` endpoint |
| `model_mental_health.pkl` | Serialized scikit-learn model used by the API |
| `Student Social Media And Mental Health Impact.csv` | Dataset used for analysis and training |
| `ML_Project.ipynb` | Exploratory analysis, preprocessing, and model experiments |
| `requirements.txt` | Python dependencies |

## Run Locally

### 1. Install Python dependencies

Python 3.9 or newer is recommended.

```bash
python -m venv .venv
```

Activate the environment, then install the packages:

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate

python -m pip install -r requirements.txt
```

### 2. Start the API

Run this from the project directory, where `model_mental_health.pkl` is located:

```bash
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Connect and open the frontend

The frontend currently sends requests to the deployed API at `https://mental-health-score-0jjb.onrender.com`. To use the API you just started, update the `API_BASE_URL` constant near the top of `script.js`:

```js
const API_BASE_URL = "http://127.0.0.1:8000";
```

In a second terminal, serve the project directory as static files:

```bash
python -m http.server 5500
```

Open `http://127.0.0.1:5500` in your browser, fill in the form, and submit it.

## API

`POST /predict` accepts a JSON object with these fields:

```json
{
	"age": 21,
	"gender": "Male",
	"country": "Canada",
	"academic_level": "Undergraduate",
	"most_used_platform": "Instagram",
	"purpose_of_use": "Entertainment",
	"avg_daily_usage_hours": 4.0,
	"daily_unlocks": 100,
	"study_hours": 4.5,
	"physical_activity_hours": 2.0,
	"sleep_hours_per_night": 7.0,
	"stress_level": "Medium"
}
```

Successful responses have this shape:

```json
{
	"predicted_mental_health_score": 6.82
}
```

Allowed values for categorical fields are defined by the API schema and can also be inspected at `/docs`. Numeric inputs are validated by the API.

## Model and Data

The notebook explores the dataset and trains regression pipelines to predict `Mental_Health_Score`. The prediction service loads the serialized model from `model_mental_health.pkl`; keep this file in the project directory when starting the API. The notebook contains the analysis and training workflow, while the CSV contains the input features and target score used in that workflow.

## Disclaimer

Predictions are estimates based on patterns in the provided dataset and can be inaccurate or biased. Do not use them to make health, treatment, or other high-impact decisions. For personal concerns, contact a qualified mental health professional or someone you trust.

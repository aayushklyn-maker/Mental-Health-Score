from fastapi import FastAPI
import joblib
from pydantic import BaseModel,Field
from typing import Literal
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

model = joblib.load('model_mental_health.pkl')
top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

class StudentData(BaseModel):
    age : int = Field(description='age of the student',ge=10,le=100)
    gender : Literal['Male','Female']
    country : str
    academic_level : Literal['Undergraduate', 'Graduate', 'High School']
    most_used_platform : Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter',
       'YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp',
       'WeChat']
    purpose_of_use : Literal['Networking', 'Education', 'Entertainment', 'News']
    avg_daily_usage_hours : float = Field(description='Average daily usage hours',ge=0,le=24)
    daily_unlocks : int = Field(description='number of times phone has been unlocked',ge=0)
    study_hours : float = Field(description='how many hours student has studied',ge=0,le=24)
    physical_activity_hours : float = Field(description='how many hours student has played',ge=0,le=24)
    sleep_hours_per_night : float = Field(description='how many hours student has slept',ge=0,le=24)
    stress_level : Literal['Medium', 'Low', 'Very High', 'High']

class PredictedResponseClass(BaseModel):
    predicted_mental_health_score : float

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_headers=['*'],
    allow_methods=['*']
)

@app.get('/')
def greet():
    return "Hello everyone!"

@app.post('/predict',response_model=PredictedResponseClass)
def predict(data:StudentData):
    group_country = data.country if data.country in top_countries else 'Other'
    input_df = pd.DataFrame([
        {
            'Age' : data.age,
            'Gender' : data.gender,
            'Country' : data.country,
            'Academic_Level' : data.academic_level,
            'Most_Used_Platform' : data.most_used_platform,
            'Purpose_Of_Use' : data.purpose_of_use,
            'Avg_Daily_Usage_Hours' : data.avg_daily_usage_hours,
            'Daily_Unlocks' : data.daily_unlocks,
            'Study_Hours' : data.study_hours,
            'Physical_Activity_Hours' : data.physical_activity_hours,
            'Sleep_Hours_Per_Night' : data.sleep_hours_per_night,
            'Stress_Level' : data.stress_level,
            'Group_Country' : group_country
        }
    ])
    prediction = model.predict(input_df)[0]
    return PredictedResponseClass(predicted_mental_health_score=round(float(prediction),2))

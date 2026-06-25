import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from openai import OpenAI
from app.health.core.config import settings
from app.health.models.user import User
from app.health.models.health_tip import HealthTip
from app.health.core.bmi_calculator import calculate_bmi

class HealthTipService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    def generate_ai_tip(self, user: User) -> dict:
        """
        Generate a health tip using OpenAI based on user profile.
        """
        bmi = calculate_bmi(user.weight, user.height) if user.weight and user.height else "Unknown"
        
        prompt = (
            f"Bạn là một chuyên gia dinh dưỡng và sức khỏe chuyên nghiệp. Hãy đưa ra một lời khuyên sức khỏe ngắn gọn, hữu ích cho ngày hôm nay cho người dùng sau:\n"
            f"- Tuổi: {user.age}\n"
            f"- Giới tính: {user.gender}\n"
            f"- Cân nặng: {user.weight}kg\n"
            f"- Chiều cao: {user.height}cm\n"
            f"- BMI: {bmi}\n"
            f"- Mục tiêu: {user.fitness_goal}\n"
            f"\n"
            f"Lời khuyên cần súc tích (tối đa 2-3 câu), mang tính khích lệ, phù hợp với hồ sơ người dùng và PHẢI VIẾT BẰNG TIẾNG VIỆT. "
            f"Trả về kết quả chính xác định dạng JSON: {{ \"tip\": \"...\", \"hashtags\": [\"#tag1\", \"#tag2\", \"#tag3\"] }}"
        )

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Bạn là một trợ lý sức khỏe hữu ích. Bạn luôn phản hồi bằng tiếng Việt và trả về kết quả định dạng JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        return json.loads(response.choices[0].message.content)

    def get_or_create_daily_tip(self, db: Session, user: User) -> HealthTip:
        """
        Get the current valid tip for the user, or generate a new one if expired.
        """
        tip = db.query(HealthTip).filter(HealthTip.user_id == user.id).first()
        
        now = datetime.utcnow()
        
        if tip and tip.expires_at > now:
            return tip
        
        # Generate new tip
        ai_data = self.generate_ai_tip(user)
        
        if tip:
            # Update existing tip
            tip.tip_content = ai_data["tip"]
            tip.hashtags = ai_data["hashtags"]
            tip.generated_at = now
            tip.expires_at = now + timedelta(hours=24)
            tip.refresh_count = 0
            db.commit()
            db.refresh(tip)
            return tip
        else:
            # Create new tip record
            new_tip = HealthTip(
                user_id=user.id,
                tip_content=ai_data["tip"],
                hashtags=ai_data["hashtags"],
                generated_at=now,
                expires_at=now + timedelta(hours=24),
                refresh_count=0
            )
            db.add(new_tip)
            db.commit()
            db.refresh(new_tip)
            return new_tip

    def refresh_tip(self, db: Session, user: User) -> HealthTip:
        """
        Force refresh the tip, limiting to 2 times per day.
        """
        tip = db.query(HealthTip).filter(HealthTip.user_id == user.id).first()
        
        if not tip:
            return self.get_or_create_daily_tip(db, user)

        # Check refresh limit (2 times per 24h since last generation)
        # If tip is already expired, it's basically a new day, we reset refresh_count in get_or_create_daily_tip
        # But here we are explicitly calling refresh.
        
        if tip.refresh_count >= 2:
            # Check if the tip has actually expired (which would reset the count)
            if datetime.utcnow() < tip.expires_at:
                raise HTTPException(status_code=429, detail="You have reached the daily refresh limit (2 tips/day).")

        # Generate new tip
        ai_data = self.generate_ai_tip(user)
        
        now = datetime.utcnow()
        tip.tip_content = ai_data["tip"]
        tip.hashtags = ai_data["hashtags"]
        tip.generated_at = now
        tip.expires_at = now + timedelta(hours=24)
        tip.refresh_count += 1
        
        db.commit()
        db.refresh(tip)
        return tip

from fastapi import HTTPException # Added for the 429 error
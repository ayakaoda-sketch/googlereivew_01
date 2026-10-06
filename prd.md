# PRD — Philippines Store Review Daily Dashboard

## 1. Product Overview

### Product Name
Philippines Store Review Daily Dashboard

### Purpose
필리핀 내 Wolhwa Galbi 및 KODOKODO 매장의 Google 리뷰를 매일 자동 수집하여,
운영자가 한 화면에서 다음을 확인할 수 있는 웹 대시보드를 만든다.

- 전일 신규 리뷰 수
- 매장별 신규 리뷰 수
- 매장별 평점 및 평점 변화
- 긍정 / 중립 / 부정 리뷰 분포
- 1~2점 저평점 리뷰
- 리뷰 내용의 핵심 이슈
- 매장별 AI 요약
- 실제 대표 리뷰
- 최근 7일 리뷰 추이

이 제품의 핵심 목표는 사용자가 리뷰 전체를 하나씩 읽지 않아도
매일 1분 이내에 각 매장의 고객 반응과 운영 이슈를 파악할 수 있도록 하는 것이다.

---

## 2. Target User

### Primary User
- Truereal 해외사업 담당자
- Philippines Area Manager
- Store Manager
- Management Team

### Main Use Case
매일 오전 대시보드에 접속해서 전일 리뷰 상황을 확인한다.

예시:

- 오늘 날짜: 2026-10-06
- 기본 분석 대상 날짜: 2026-10-05
- 비교 대상 날짜: 2026-10-04

즉, 대시보드의 "Today"는 현재 시각 기준 리뷰가 아니라
**전일 완료 데이터 기준 Daily Report**를 의미한다.

---

## 3. Core Product Principle

이 서비스는 단순 리뷰 목록 서비스가 아니다.

핵심은:

> "어제 각 매장에서 무슨 일이 있었는지 한 장으로 이해하는 운영 대시보드"

사용자는 리뷰 원문보다 먼저 요약과 이상 징후를 확인해야 한다.

---

## 4. Supported Stores

초기 버전에서는 아래 매장을 지원한다.

### Wolhwa Galbi
1. MAAX, Pasay
2. Greenhills
3. Ayala Fairview
4. Tomas Morato

### KODOKODO
5. KODOKODO Jazz Mall, Makati

향후 신규 매장을 관리자 페이지 또는 DB에서 추가할 수 있어야 한다.

예:
- SM BF Parañaque
- Estancia
- RER Makati
- 기타 신규 매장

매장 목록을 코드에 하드코딩하지 않는 구조를 권장한다.

---

## 5. Date Logic

### Default Date

사용자가 2026-10-06에 접속하면 기본 화면은 다음과 같이 표시한다.

- Review Date: 2026-10-05
- Compared With: 2026-10-04
- Generated At: 2026-10-06 08:00

### UI Requirement

화면 상단에 분석 날짜를 명확히 표시한다.

예:

**Review Date · Oct 5, 2026**

Sub text:

Compared with Oct 4 · Generated Oct 6, 2026

### Date Selector

사용자는 과거 날짜를 선택할 수 있어야 한다.

예:

[ < ]  Oct 5, 2026  [ > ]

또는 Date Picker 사용.

미래 날짜는 선택할 수 없다.

---

## 6. Dashboard Information Architecture

전체 화면은 크게 3개 영역으로 구성한다.

### A. Global Summary
전체 매장 요약

### B. Store List
매장별 핵심 KPI

### C. Store Analysis
선택한 매장의 상세 분석

Desktop 기준 1페이지 안에서 최대한 많은 정보를 확인할 수 있도록 설계한다.

---

# 7. Global Summary

화면 상단에 Philippines 전체 매장 기준 KPI를 표시한다.

필수 KPI:

### Total New Reviews
전일 신규 리뷰 총합

예:
+26 Reviews

### Change vs Previous Day

예:
+8 vs Oct 4

### Average New Review Rating

예:
4.7 ★

주의:
전체 누적 평점이 아니라
선택한 날짜에 새로 등록된 리뷰들의 평균 평점.

### Negative Reviews

1~2점 리뷰 총 개수

예:
3 Critical Reviews

### Positive Reviews

4~5점 리뷰 총 개수

---

# 8. Philippines Daily AI Brief

전체 매장을 대상으로 AI가 하루를 요약한다.

예:

> 총 26개의 신규 리뷰가 등록되었습니다.
> MAAX와 Tomas Morato에서 서비스 및 Premium Galbi에 대한 긍정적인 피드백이 많았습니다.
> Ayala Fairview에서는 음식의 flavor intensity 관련 부정 피드백이 확인되었습니다.
> MAAX에서는 waiting time 관련 2점 리뷰 1건이 있어 확인이 필요합니다.

### AI Brief Rules

AI 요약은 아래 우선순위로 생성한다.

1. 저평점 리뷰
2. 전일 대비 급격한 리뷰 증가
3. 반복적으로 등장하는 부정 키워드
4. 반복적으로 등장하는 긍정 키워드
5. 특이사항

단순히 모든 리뷰를 평균적으로 요약하지 않는다.

---

# 9. Store List

화면 왼쪽 또는 상단에 매장 리스트를 표시한다.

각 Store Card에 표시:

- Store Name
- Brand
- New Reviews
- Average Rating
- Positive Reviews
- Negative Reviews
- Change vs Previous Day

예:

### MAAX

+8 Reviews  
4.8 ★  
7 Positive  
1 Negative  
+3 vs yesterday

Store Card 클릭 시 해당 매장의 상세 분석 화면으로 변경한다.

선택된 매장은 UI상 명확하게 강조한다.

---

# 10. Store-Level Analysis

이 기능이 제품의 핵심이다.

각 매장을 클릭하면 해당 매장만 별도로 분석한다.

## Store Header

예:

Ayala Fairview  
Store Analysis · Oct 5, 2026

표시 KPI:

- New Reviews
- Average New Rating
- Positive Reviews
- Neutral Reviews
- Negative Reviews
- Rating Change

---

# 11. Store AI Summary

매장별 리뷰를 AI가 한국어로 요약한다.

예:

> 오늘 Fairview에는 신규 리뷰가 3건 등록되었습니다.
> 서비스 관련 피드백은 대체로 긍정적이었지만,
> 음식의 flavor가 다소 약하다는 의견이 1건 확인되었습니다.
> 동일한 flavor 관련 의견이 최근 7일 동안 반복되고 있어
> 매장 운영팀 확인이 필요합니다.

### Summary Requirements

AI는 다음을 구분해야 한다.

- Good
- Watch
- Critical

단순 감성 분석이 아니라 운영 관점으로 작성한다.

---

# 12. Review Topic Classification

각 리뷰를 아래 Topic으로 자동 분류한다.

필수 초기 Topic:

- Food Quality
- Flavor
- Meat Quality
- Service
- Staff
- Waiting Time
- Cleanliness
- Price / Value
- Promotion
- Portion
- Side Dishes
- Soup
- Atmosphere
- Accessibility
- Other

리뷰 하나에 여러 Topic이 지정될 수 있다.

예:

"Food was good but we waited 30 minutes."

Topic:
- Food Quality
- Waiting Time

---

# 13. Positive / Negative Insights

매장 상세화면에서 다음 두 섹션을 표시한다.

## What Customers Liked

예:

- Premium Galbi quality
- Friendly staff
- Fast refill service
- Clean dining area

가능하면 각 항목 옆에 언급 횟수를 표시한다.

예:

Friendly Staff · 4 mentions

## Needs Attention

예:

- Waiting Time · 3 mentions
- Flavor too mild · 2 mentions
- Slow table cleaning · 1 mention

부정 이슈가 반복될수록 상단에 노출한다.

---

# 14. Critical Review Alert

1점 또는 2점 리뷰는 별도 강조한다.

예:

CRITICAL REVIEW

★ 2

"The meat was good but we waited almost 40 minutes..."

Store: MAAX  
Topic: Waiting Time  
Date: Oct 5, 2026

저평점 리뷰가 없는 경우:

"No critical reviews today."

---

# 15. Review Feed

선택 날짜의 실제 리뷰를 확인할 수 있다.

표시 정보:

- Rating
- Reviewer Name
- Review Text
- Review Date
- Store
- AI Sentiment
- Topics

정렬 기본값:

1. 낮은 평점
2. 최신 리뷰

필터:

- All
- Positive
- Negative
- 1–2 Stars
- Topic

---

# 16. Recent 7-Day Trend

각 매장별 최근 7일 그래프를 제공한다.

### Chart 1
Daily New Reviews

예:

Sep 29 — 4
Sep 30 — 3
Oct 1 — 8
Oct 2 — 5
Oct 3 — 4
Oct 4 — 5
Oct 5 — 8

### Chart 2
Average Rating

가능하면 신규 리뷰 기준 평균 별점 추이를 보여준다.

---

# 17. Data Definitions

## New Review

해당 Review Date의 00:00~23:59 사이 생성된 리뷰.

시간대:

Asia/Manila

기준 권장.

Google API timestamp는 UTC일 수 있으므로
DB 저장 시 Manila timezone 기준 날짜 필드를 별도로 저장한다.

---

# 18. Suggested Data Model

## stores

- id
- brand
- store_name
- google_location_id
- address
- active
- created_at

## reviews

- id
- google_review_id
- store_id
- reviewer_name
- rating
- review_text
- google_created_at
- local_review_date
- updated_at

## review_analysis

- review_id
- sentiment
- sentiment_score
- topics
- summary
- is_critical
- analyzed_at

## daily_store_summary

- date
- store_id
- new_review_count
- avg_rating
- positive_count
- neutral_count
- negative_count
- critical_count
- ai_summary
- positive_insights
- negative_insights

---

# 19. Sentiment Definition

권장 초기 기준:

### Positive
4~5 Stars

### Neutral
3 Stars

### Negative
1~2 Stars

AI sentiment는 텍스트 내용을 추가 분석하되
Dashboard KPI는 별점 기준을 우선한다.

예:

5점 리뷰지만 텍스트에 개선사항이 있는 경우
positive KPI로 카운트하되 AI topic에는 issue를 기록할 수 있다.

---

# 20. Data Collection

최종 목표는 Google Business Profile 데이터를 자동으로 가져오는 것이다.

권장 흐름:

Google Business Profile API  
→ Backend  
→ Database  
→ AI Review Analysis  
→ Dashboard

### Sync Frequency

MVP:
매일 오전 06:00 Philippines Time

향후:
1시간마다 또는 필요 시.

---

# 21. AI Analysis Flow

새로운 리뷰가 DB에 들어오면 AI 분석을 수행한다.

AI Output JSON 예:

```json
{
  "sentiment": "negative",
  "topics": [
    "waiting_time",
    "service"
  ],
  "summary_ko": "대기 시간이 길었고 직원 응대가 늦었다는 불만",
  "critical": true
}
```

매장 Daily Summary 생성 시
해당 날짜 리뷰 분석 결과를 묶어 AI에게 다시 전달한다.

---

# 22. Recommended MVP Tech Stack

Antigravity에서 구현 시 특정 프레임워크에 종속될 필요는 없지만,
아래 구성을 권장한다.

Frontend:
- Next.js
- React
- Tailwind CSS

Backend / Database:
- Supabase

AI:
- OpenAI API

Deployment:
- Vercel

Data Source:
- Google Business Profile API

Chart:
- Recharts

---

# 23. UI / Design Direction

### Style

- Clean
- Modern
- Management Dashboard
- Information dense but easy to scan
- Desktop first
- Responsive

### Brand Separation

Wolhwa Galbi와 KODOKODO는 Brand Badge로 구분한다.

예:

WOLHWA GALBI  
KODOKODO

### Color Logic

색상은 브랜드보다 상태 표시 용도로 더 적극적으로 사용한다.

- Positive: Green
- Neutral: Gray / Amber
- Negative: Red
- Critical: Red 강조

주의:
화면 전체를 브랜드 컬러로 과하게 채우지 않는다.

---

# 24. Main Screen Example

```text
PHILIPPINES REVIEW DASHBOARD

Review Date · Oct 5, 2026
Compared with Oct 4 · Generated Oct 6

+26 New Reviews
4.7 ★
23 Positive
3 Critical


AI DAILY BRIEF

MAAX and Tomas Morato received strong feedback...
Fairview had recurring flavor-related feedback...


STORES

MAAX              +8   4.8★
Greenhills        +5   4.7★
Ayala Fairview    +3   4.5★
Tomas Morato      +6   4.8★
KODOKODO Jazz     +4   4.6★


AYALA FAIRVIEW
Store Analysis

+3 Reviews
4.5★
2 Positive
1 Negative

AI SUMMARY
Customers were generally satisfied with service,
but one review mentioned that the flavor was too mild.

WHAT CUSTOMERS LIKED

Friendly Staff          2
Clean Store             1

NEEDS ATTENTION

Flavor                   1


CRITICAL REVIEW

★2
"The meat tasted a little bland..."


7 DAY TREND

▁ ▂ ▅ ▃ ▂ ▃ ▅
```

---

# 25. MVP Scope

Version 1에서 반드시 구현:

- Dashboard
- Review Date 표시
- Date Selector
- 전체 신규 리뷰 수
- 전체 평점
- Store List
- Store별 신규 리뷰 수
- Store별 평균 별점
- Store 선택
- Store별 AI Summary
- Positive Insights
- Needs Attention
- Critical Review
- Review Feed
- 7 Day Review Trend

---

# 26. Not Required for MVP

초기 버전에서 제외 가능:

- Review Reply 기능
- Google 리뷰 직접 답변
- Store Manager Login
- Slack Notification
- Email Report
- Monthly Report
- Competitor Review Tracking
- Facebook Reviews
- TripAdvisor Reviews
- Delivery App Reviews

---

# 27. Future Features

## Daily Notification

매일 오전 자동으로:

"Yesterday Philippines Reviews"

형태의 요약 전달.

채널 후보:

- Email
- Slack
- Telegram
- Kakao

---

## Weekly Report

주간:

- 신규 리뷰 증가량
- 평균 평점 변화
- 반복 부정 이슈
- Best Performing Store
- Store Requiring Attention

---

## Issue Detection

예:

Waiting Time complaints

Last 7 days:
MAAX: 8 mentions

AI Alert:

"MAAX에서 Waiting Time 관련 불만이 최근 7일 동안 증가하고 있습니다."

---

## Store Ranking

매장 순위:

- Review Growth
- Rating
- Positive Ratio
- Negative Ratio

단, 직원 평가를 위한 단순 경쟁 지표보다는
운영 개선용 참고 지표로 사용한다.

---

# 28. Acceptance Criteria

제품 MVP 완료 기준:

1. 사용자가 사이트에 접속하면 전일 날짜가 자동 선택된다.
2. 선택된 Review Date가 화면 상단에 명확하게 표시된다.
3. 전체 매장의 신규 리뷰 수를 확인할 수 있다.
4. 매장별 신규 리뷰 수를 확인할 수 있다.
5. 매장을 클릭하면 해당 매장 상세 분석이 나타난다.
6. 상세화면에서 AI Summary를 확인할 수 있다.
7. 긍정 이슈와 개선 이슈가 구분된다.
8. 1~2점 리뷰가 별도로 표시된다.
9. 실제 리뷰 원문을 확인할 수 있다.
10. 과거 날짜를 선택할 수 있다.
11. 최근 7일 신규 리뷰 추이를 확인할 수 있다.
12. 신규 매장을 DB에 추가하면 UI에도 자동 반영된다.

---

# 29. Development Priority

### Phase 1 — UI Prototype

Mock Data 사용.

목표:
전체 UX 완성.

---

### Phase 2 — Database

Supabase 연결.

Mock Data 제거.

---

### Phase 3 — Google Review Sync

Google Business Profile API 연결.

Daily Sync.

---

### Phase 4 — AI Analysis

Review 자동 분석.

Topic / Sentiment / Summary 생성.

---

### Phase 5 — Automation

Daily Summary 자동 생성.

---

# 30. Most Important UX Rule

사용자가 사이트에 들어와서 가장 먼저 답을 얻어야 하는 질문은 다음이다.

1. 어제 리뷰가 총 몇 개 늘었나?
2. 어느 매장에서 가장 많이 늘었나?
3. 안 좋은 리뷰가 있었나?
4. 어떤 문제였나?
5. 매장별로 무슨 일이 있었나?

이 5개의 답이 스크롤을 많이 하지 않고 한 화면 안에서 보여야 한다.

---

# 31. Initial Mock Data Requirement

Google API 연결 전 개발 단계에서는 Mock Data를 사용한다.

Review Date:
2026-10-05

Stores:

- MAAX
- Greenhills
- Ayala Fairview
- Tomas Morato
- KODOKODO Jazz Mall

각 매장마다 최소 3~8개의 Mock Review를 넣어
AI Summary, Topics, Positive / Negative Insight UI를 테스트할 수 있도록 한다.

---

# 32. Language

Dashboard UI:

기본 영어 권장.

이유:
필리핀 현지팀과 함께 사용할 수 있기 때문.

AI Summary:

초기에는 한국어.

향후 Toggle:

KR / EN

지원 가능하도록 설계.

---

# 33. Final Product Vision

최종적으로 이 웹사이트는 단순 Review Dashboard가 아니라

**Philippines Store Customer Voice Dashboard**

로 발전시키는 것을 목표로 한다.

Google Review뿐 아니라 향후:

- Facebook
- GrabFood
- Foodpanda
- Delivery Apps
- Customer Survey
- CRM Feedback

까지 통합하여

각 매장의 고객 경험을 매일 한 화면으로 보여주는
운영 관리 시스템으로 확장할 수 있다.

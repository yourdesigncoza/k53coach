# K53 AI Coach

## Product Requirements Document (PRD) v1.0

### Product Name

K53 AI Coach

### Tagline

Learn. Practice. Pass.

# Executive Summary

K53 AI Coach is an AI-powered Progressive Web App (PWA) designed to help South African learner drivers pass their K53 Learner’s Licence Test and later prepare for their Practical Driving Test.

Unlike traditional K53 apps that focus on question banks and mock exams, K53 AI Coach uses AI coaching, readiness prediction, adaptive learning, and analytics to provide personalized study plans and confidence-building support.

The platform consists of two products:

1.  K53 Learner Licence Coach
2.  K53 Driving Coach (Phase 2)

# Vision

To become South Africa’s most effective learner driver preparation platform by combining:

- Verified K53 content
- AI coaching
- Adaptive testing
- Readiness prediction
- Parent and school reporting

# Problem Statement

Current K53 apps provide:

- Question banks
- Road signs
- Mock tests

But they do not:

- Explain mistakes
- Identify weak areas
- Predict readiness
- Create personalized study plans
- Provide parent visibility

K53 AI Coach fills this gap.

# Target Users

## Primary

Learners aged 16–25

Goals:

- Pass learner’s licence
- Improve confidence
- Reduce exam anxiety

## Secondary

Parents

Goals:

- Track readiness
- Monitor progress
- Reduce repeat testing costs

## Tertiary

Schools

Goals:

- Improve learner licence pass rates
- Offer preparation programs

# Product Scope

## Phase 1

K53 Learner Licence Coach

Includes:

- Road Signs
- Rules of the Road
- Vehicle Controls
- AI Coach
- Readiness Assessment
- Mock Exams

## Phase 2

K53 Driving Coach

Includes:

- Yard Test Preparation
- Practical Driving Test Preparation
- Observation Training
- Parking Coaching
- Driving Readiness Scoring

# Platform

## MVP

Progressive Web App

Accessible via:

- Mobile browser
- Desktop browser
- QR code

## Future

- Android App
- iOS App

# Core Features

## User Accounts

Roles:

- Learner
- Parent
- School
- Admin

Features:

- Registration
- Login
- Password reset
- Email verification

## Readiness Assessment

New users complete:

30-question diagnostic test

Output:

- Road Signs readiness
- Road Rules readiness
- Vehicle Controls readiness
- Overall readiness

## Learning Modules

### Module 1

Road Signs

### Module 2

Rules of the Road

### Module 3

Vehicle Controls

## Question Bank

Database 4.1

Contains:

- 750 Questions
- 3,000 Answer Options
- Correct Answers
- AI Explanations
- Topic Mapping
- Difficulty Ratings

## AI Coach

Database 5

For every question:

- Official explanation
- Simple explanation
- Memory trick
- Common confusion
- Follow-up question
- Study recommendation

## Exam Generator

Database 6

Generates:

- Mock Exams
- Weak Area Tests
- Easy Tests
- Medium Tests
- Hard Tests
- Readiness Assessments

## Analytics & Pass Prediction

Database 7

Tracks:

- Question history
- Mock exams
- Accuracy
- Weak areas
- Study time

Predicts:

- Readiness %
- Pass probability

## Readiness Scoring Engine

Database 9

Formula:

40% Mock Exam Average

25% Topic Accuracy

20% Weak Area Improvement

15% Consistency Score

## Parent Dashboard

Database 10

Displays:

- Readiness score
- Progress
- Weak areas
- Study time
- Recommendations

## School Dashboard

Database 10

Displays:

- Class readiness
- School averages
- At-risk learners
- Progress reports

# Content Databases

## Database 1

Road Signs Library

Approx. 700–1,000 records

## Database 2

Rules of the Road Library

Approx. 600–700 records

## Database 3

Vehicle Controls Library

Approx. 275–300 records

## Database 4

Question & Explanation Library

750 Questions

## Database 5

AI Coaching Library

750 Coaching Cards

# Technical Architecture

Frontend:

- NextJS
- Supabase
- Tailwind

Backend:

- Supabase

Database:

- PostgreSQL

Authentication:

- Supabase Auth

AI:

- OpenAI API

Hosting:

- Vercel

Payments:

- PayFast
- Yoco

# Payment Model

## Free Tier

Includes:

- Readiness Test
- Limited Questions

## Premium

Learner Licence Coach

R149–R199

90 Days Access

## Driving Coach

R149

90 Days Access

## Bundle

Learner + Driving

R249

## School Pricing

R99 per learner

90 Days

# Legal & Compliance

Database 12

Required Documents:

- Terms & Conditions
- Privacy Policy
- POPIA Policy
- Parent Consent Policy
- Refund Policy
- School Agreement
- Cookie Policy
- AI Usage Disclaimer

# Success Metrics

## KPI 1

Average Readiness Improvement

Target:

+25%

## KPI 2

Subscription Conversion

Target:

15%

## KPI 3

Mock Exam Completion

Target:

70%

## KPI 4

Predicted vs Actual Pass Accuracy

Target:

80%+

# MVP Deliverables

Version 1 Launch

✓ User Accounts

✓ Road Signs Module

✓ Rules Module

✓ Vehicle Controls Module

✓ 750 Question Bank

✓ AI Coaching Library

✓ Exam Generator

✓ Readiness Assessment

✓ Pass Prediction Engine

✓ Parent Dashboard

✓ Payment System

✓ Legal Compliance

# Future Roadmap

Version 2

- Practical Driving Coach
- Yard Test Training
- Driving Readiness Score
- Instructor Dashboard

Version 3

- AI Voice Tutor
- Photo Road Sign Recognition
- Driving Video Analysis
- School Enterprise Portal

# Product Goal

K53 AI Coach should provide every learner with one clear answer:

“You are ready to pass — and here is why.”

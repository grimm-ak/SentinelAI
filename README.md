# AI SOC

AI-powered Security Operations Center for network intrusion detection,
security alert generation, investigation, and incident management.

## Project Goals

- Detect malicious network traffic using machine learning
- Classify different types of attacks
- Generate security risk scores
- Detect anomalous network behavior
- Store security events and alerts
- Provide APIs for security monitoring
- Build an AI SOC investigation assistant
- Provide a React-based analyst dashboard
- Evaluate the system using security-focused metrics

## Architecture

Network Events
        |
        v
ML Detection Engine
        |
        v
Risk Scoring
        |
        v
Alert Engine
        |
        v
AI SOC Agent
        |
        +---- Knowledge Base
        |
        +---- Security Tools
        |
        v
Analyst Dashboard

## Dataset

Initial dataset:

UNSW-NB15

The dataset contains network traffic features and labels for
normal and malicious traffic.

Source:
https://www.kaggle.com/dsv/9350725

## Current Status

Phase 1 - Dataset setup and exploration
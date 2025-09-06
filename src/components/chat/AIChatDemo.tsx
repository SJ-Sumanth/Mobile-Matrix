'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface DemoResponse {
  message: string;
  userMessage: string;
  suggestions: string[];
  confidence: number;
}

export function AIChatDemo() {
  const [selectedDemo, setSelectedDemo] = useState<number | null>(null);

  // Demo responses showing how the AI now responds differently to different inputs
  const demoResponses: DemoResponse[] = [
    {
      userMessage: "I want to compare iPhone 15 and Samsung Galaxy S24",
      message: "I can help you compare phones! You mentioned iPhone 15 and Samsung Galaxy S24. These are both excellent flagship phones. The iPhone 15 features Apple's A16 Bionic chip and iOS ecosystem, while the Galaxy S24 offers Snapdragon 8 Gen 3 performance and Android flexibility. What specific aspects would you like me to compare - camera quality, performance, battery life, or overall value?",
      suggestions: ["Camera comparison", "Performance benchmarks", "Battery life", "Price and value"],
      confidence: 0.9
    },
    {
      userMessage: "What is the best phone under ₹30,000?",
      message: "For a budget of ₹30,000, I can suggest some excellent options! Popular phones in this range include Samsung Galaxy A54 (₹28,999), OnePlus Nord 3 (₹29,999), Realme GT Neo 5 (₹27,999), and Xiaomi 13 Lite (₹25,999). What do you primarily use your phone for - photography, gaming, or general use?",
      suggestions: ["Photography focused", "Gaming performance", "General use", "Best value for money"],
      confidence: 0.8
    },
    {
      userMessage: "Tell me about OnePlus 12 camera quality",
      message: "Great choice! The OnePlus 12 has an impressive camera system with a 50MP main sensor, 64MP periscope telephoto with 3x optical zoom, and 48MP ultrawide camera. It excels in portrait photography and low-light performance. The Hasselblad partnership brings natural color tuning. Would you like to compare it with another phone's camera, or do you want to know more about its video recording capabilities?",
      suggestions: ["Compare with iPhone 15 camera", "Video recording features", "Night mode performance", "Portrait photography"],
      confidence: 0.8
    },
    {
      userMessage: "Which phone has better battery life?",
      message: "Battery life is crucial! Phones with excellent battery life include OnePlus 12 (5400mAh), Xiaomi 14 Ultra (5300mAh), Samsung Galaxy S24+ (4900mAh), and Realme GT 6 (5500mAh). Are you looking for long battery life, fast charging, or both? Also, which specific phones were you considering?",
      suggestions: ["Long battery life", "Fast charging", "Both battery and charging", "Gaming battery life"],
      confidence: 0.8
    },
    {
      userMessage: "I need a gaming phone recommendation",
      message: "For gaming and performance, top choices are iPhone 15 Pro (A17 Pro chip), Samsung Galaxy S24 (Snapdragon 8 Gen 3), OnePlus 12 (Snapdragon 8 Gen 3), and Xiaomi 14 (Snapdragon 8 Gen 3). What type of games do you play most? Also, what's your budget range?",
      suggestions: ["Heavy games (PUBG, COD)", "Casual games", "Under ₹50,000", "Flagship gaming phones"],
      confidence: 0.8
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          AI Chat Response Demo
        </h1>
        <p className="text-muted-foreground">
          See how the AI now provides different, contextual responses to different user inputs
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          🎯 Problem Fixed: Unique Responses for Each Query
        </h2>
        <p className="text-muted-foreground mb-4">
          Previously, the AI was giving the same generic response regardless of user input. 
          Now it analyzes each message and provides contextual, relevant responses.
        </p>
        
        <div className="grid gap-4">
          {demoResponses.map((demo, index) => (
            <div key={index} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setSelectedDemo(selectedDemo === index ? null : index)}
                className="w-full p-4 text-left hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary">
                      User: "{demo.userMessage}"
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click to see AI response
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {Math.round(demo.confidence * 100)}% confidence
                    </Badge>
                    <span className="text-muted-foreground">
                      {selectedDemo === index ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
              </button>
              
              {selectedDemo === index && (
                <div className="border-t border-border p-4 bg-accent/20">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">AI Response:</h4>
                      <p className="text-foreground bg-primary/10 p-3 rounded border-l-4 border-primary">
                        {demo.message}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Suggested Follow-ups:</h4>
                      <div className="flex flex-wrap gap-2">
                        {demo.suggestions.map((suggestion, idx) => (
                          <Badge key={idx} variant="outline">
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-success/10 border-success/20">
        <h3 className="font-semibold text-success mb-3">✅ What's Fixed:</h3>
        <ul className="space-y-2 text-sm">
          <li>• <strong>Contextual Analysis:</strong> AI now analyzes each user message for intent, brands, models, and features</li>
          <li>• <strong>Phone Recognition:</strong> Automatically detects phone models mentioned in messages</li>
          <li>• <strong>Budget Awareness:</strong> Recognizes price mentions and provides relevant suggestions</li>
          <li>• <strong>Feature-Specific Responses:</strong> Different responses for camera, battery, gaming, and performance queries</li>
          <li>• <strong>Intelligent Fallbacks:</strong> Even without API key, provides smart rule-based responses</li>
          <li>• <strong>Conversation Memory:</strong> Maintains context across multiple messages</li>
        </ul>
      </Card>

      <Card className="p-6 bg-warning/10 border-warning/20">
        <h3 className="font-semibold text-warning mb-3">⚙️ Setup Required:</h3>
        <p className="text-sm mb-3">
          To get the full AI experience with even more dynamic responses, you need to configure the Gemini API key.
        </p>
        <div className="space-y-2 text-sm">
          <p>1. Get a free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></p>
          <p>2. Add <code className="bg-accent px-2 py-1 rounded">GEMINI_API_KEY="your_key_here"</code> to your .env file</p>
          <p>3. Restart the development server</p>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          See AI_SETUP.md for detailed instructions
        </p>
      </Card>
    </div>
  );
}
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Brain, Sparkles, Trophy, Target } from 'lucide-react'

interface QuizRendererProps {
  htmlContent: string
}

export const QuizRenderer: React.FC<QuizRendererProps> = ({ htmlContent }) => {
  const enhancedHtml = `
    <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            color: #EFEFEF; 
            padding: 1.5rem; 
            margin: 0;
            min-height: 100vh;
          }
          .quiz-container {
            max-width: 800px;
            margin: 0 auto;
          }
          .quiz-header {
            text-align: center;
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
          }
          .quiz-title {
            background: linear-gradient(135deg, #f59e0b, #f97316);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
          }
          .question { 
            margin-bottom: 2rem; 
            padding: 1.5rem;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            transition: all 0.3s ease;
          }
          .question:hover {
            border-color: rgba(245, 158, 11, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          .question h3 {
            background: linear-gradient(135deg, #f59e0b, #f97316);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-top: 0;
            margin-bottom: 1rem;
            font-size: 1.1rem;
            font-weight: bold;
          }
          .options label { 
            display: block; 
            margin: 0.75rem 0; 
            padding: 1rem; 
            border: 1px solid rgba(255, 255, 255, 0.1); 
            border-radius: 0.75rem; 
            cursor: pointer; 
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
          }
          .options label:hover {
            background: rgba(245, 158, 11, 0.1);
            border-color: rgba(245, 158, 11, 0.5);
            transform: translateX(5px);
          }
          .options input:checked + span { 
            font-weight: bold; 
            color: #f59e0b; 
          }
          .options input[type="radio"] {
            margin-right: 0.75rem;
            accent-color: #f59e0b;
          }
          #result { 
            margin-top: 2rem; 
            font-weight: bold; 
            padding: 1.5rem;
            background: rgba(245, 158, 11, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 1rem;
            text-align: center;
            color: #f59e0b;
            animation: fadeIn 0.5s ease-out;
          }
          button {
            background: linear-gradient(135deg, #f59e0b, #f97316);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 0.75rem;
            cursor: pointer;
            font-weight: bold;
            margin-top: 1.5rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
          }
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .score-display {
            font-size: 1.2rem;
            margin-bottom: 0.5rem;
          }
          .score-message {
            font-size: 0.9rem;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <div class="quiz-container">
          <div class="quiz-header">
            <div class="quiz-title">🎯 Interactive Quiz</div>
            <p>Test your knowledge</p>
          </div>
          ${htmlContent}
          <script>
            document.addEventListener('submit', function(e) {
              e.preventDefault();
              const form = e.target;
              const formData = new FormData(form);
              let score = 0;
              let total = 0;
              for (let pair of formData.entries()) {
                total++;
                if (pair[1] === 'correct') {
                  score++;
                }
              }
              const resultEl = form.querySelector('#result') || document.createElement('div');
              resultEl.id = 'result';
              const percentage = Math.round((score / total) * 100);
              let message = '';
              if (percentage >= 90) {
                message = 'Excellent! You are an expert on this topic.';
              } else if (percentage >= 70) {
                message = 'Great! You have a good command of the content.';
              } else if (percentage >= 50) {
                message = 'Good! You need a bit more practice.';
              } else {
                message = 'Keep studying! Review the material again.';
              }
              resultEl.innerHTML = '<div class="score-display">🎯 Your score: ' + score + ' out of ' + total + ' (' + percentage + '%)</div><div class="score-message">' + message + '</div>';
              if(!form.querySelector('#result')){
                 form.appendChild(resultEl);
              }
              resultEl.scrollIntoView({ behavior: 'smooth' });
            });
          </script>
        </div>
      </body>
    </html>
  `

  return (
    <Card className='my-8 card-modern animate-fade-in-scale'>
      <CardHeader>
        <CardTitle className='text-xl font-bold text-gradient flex items-center gap-3'>
          <Brain className='w-6 h-6' />
          <Target className='w-5 h-5 text-orange-400' />
          Interactive Quiz
          <Sparkles className='w-5 h-5 text-orange-400 animate-pulse' />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <iframe
          srcDoc={enhancedHtml}
          sandbox='allow-forms allow-scripts'
          className='w-full h-96 border-0 rounded-xl bg-transparent'
          title='Interactive Quiz'
        />
      </CardContent>
    </Card>
  )
}

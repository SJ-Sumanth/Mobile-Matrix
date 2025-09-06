'use client';

import { useState } from 'react';

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleStartChat = () => {
    setIsChatOpen(true);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage = { 
        role: 'assistant', 
        content: `I can help you compare phones! You mentioned: "${inputMessage}". What specific features are you looking for?` 
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const suggestions = [
    "Compare iPhone 15 vs Samsung Galaxy S24",
    "Best phones under ₹30,000",
    "Phones with best camera quality",
    "Gaming phones with high refresh rate"
  ];

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(255, 107, 53, 0.5); }
          50% { box-shadow: 0 0 20px rgba(255, 107, 53, 0.8); }
        }
      `}</style>
      
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#000000', 
        color: '#ffffff', 
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
      {/* Header */}
      <header style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem'
        }}>
          <span style={{ color: '#ff6b35' }}>Mobile</span>
          <span style={{ color: '#ffffff' }}> Matrix</span>
        </h1>
        <p style={{ 
          fontSize: '1.3rem', 
          color: '#cccccc',
          maxWidth: '800px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          AI-powered phone comparison platform that helps you make the perfect choice. Compare specifications, prices, and features across all brands launched in India.
        </p>
      </header>

      {/* Stats Section */}
      <section style={{ 
        backgroundColor: '#1a1a1a', 
        padding: '3rem 2rem', 
        margin: '0 2rem 3rem 2rem',
        borderRadius: '12px'
      }}>
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          marginBottom: '1rem',
          color: '#ffffff'
        }}>
          Compare Phones from Top Brands
        </h2>
        <p style={{ 
          textAlign: 'center', 
          color: '#cccccc', 
          marginBottom: '2rem',
          fontSize: '1.1rem',
          lineHeight: '1.6'
        }}>
          Discover the perfect phone from over 200+ models across all major brands
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '2rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              color: '#ff6b35',
              marginBottom: '0.5rem'
            }}>
              200+
            </div>
            <div style={{ color: '#cccccc' }}>Phone Models</div>
          </div>
          <div>
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              color: '#ff6b35',
              marginBottom: '0.5rem'
            }}>
              15+
            </div>
            <div style={{ color: '#cccccc' }}>Brands</div>
          </div>
          <div>
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              color: '#ff6b35',
              marginBottom: '0.5rem'
            }}>
              50K+
            </div>
            <div style={{ color: '#cccccc' }}>Comparisons</div>
          </div>
          <div>
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              color: '#ff6b35',
              marginBottom: '0.5rem'
            }}>
              99%
            </div>
            <div style={{ color: '#cccccc' }}>Accuracy</div>
          </div>
        </div>
      </section>

      {/* Brand Showcase */}
      <section style={{ padding: '2rem', marginBottom: '3rem' }}>
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          marginBottom: '2rem',
          color: '#ffffff'
        }}>
          Popular Brands
        </h2>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          flexWrap: 'wrap', 
          gap: '2rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {[
            { name: 'Apple', icon: '🍎' },
            { name: 'Samsung', icon: '📱' },
            { name: 'OnePlus', icon: '⚡' },
            { name: 'Xiaomi', icon: '🔥' },
            { name: 'Realme', icon: '💎' },
            { name: 'Vivo', icon: '📷' },
            { name: 'Nothing', icon: '⚪' }
          ].map((brand, index) => (
            <div 
              key={brand.name} 
              style={{ 
                backgroundColor: '#1a1a1a', 
                padding: '1.5rem 2rem', 
                borderRadius: '12px',
                border: '1px solid #333333',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: 'translateY(0px)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                animation: `float 3s ease-in-out infinite ${index * 0.5}s`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: '120px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.3)';
                e.currentTarget.style.borderColor = '#ff6b35';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#333333';
              }}
            >
              <div style={{ 
                fontSize: '2rem', 
                marginBottom: '0.5rem',
                animation: `pulse 2s ease-in-out infinite ${index * 0.3}s`
              }}>
                {brand.icon}
              </div>
              <div style={{ 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                color: '#ffffff',
                textAlign: 'center'
              }}>
                {brand.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Chat Section */}
      <section style={{ padding: '2rem', marginBottom: '3rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            textAlign: 'center', 
            marginBottom: '1rem',
            color: '#ffffff'
          }}>
            AI-Powered Phone Comparison
          </h2>
          <p style={{ 
            textAlign: 'center', 
            color: '#cccccc', 
            marginBottom: '3rem',
            fontSize: '1.1rem',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto 3rem auto'
          }}>
            Chat with our AI assistant to find and compare the perfect phones for your needs. Get personalized recommendations based on your preferences and budget.
          </p>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isChatOpen ? '2fr 1fr' : '1fr', 
            gap: '2rem'
          }}>
            {/* Chat Interface */}
            <div>
              {!isChatOpen ? (
                <div style={{ 
                  backgroundColor: '#1a1a1a', 
                  padding: '3rem', 
                  borderRadius: '12px',
                  border: '1px solid #333333',
                  textAlign: 'center',
                  cursor: 'pointer',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }} onClick={handleStartChat}>
                  <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>💬</div>
                  <h3 style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: 'bold', 
                    marginBottom: '1rem',
                    color: '#ffffff'
                  }}>
                    Start Your Phone Comparison Journey
                  </h3>
                  <p style={{ 
                    color: '#cccccc', 
                    marginBottom: '2rem',
                    fontSize: '1.1rem',
                    lineHeight: '1.6'
                  }}>
                    Click here to begin chatting with our AI assistant. We'll help you find the perfect phone based on your needs.
                  </p>
                  <button style={{
                    backgroundColor: '#ff6b35',
                    color: '#ffffff',
                    padding: '1rem 2rem',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    Start Chat
                  </button>
                </div>
              ) : (
                <div style={{ 
                  backgroundColor: '#1a1a1a', 
                  borderRadius: '12px',
                  border: '1px solid #333333',
                  height: '500px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Chat Header */}
                  <div style={{ 
                    padding: '1rem 1.5rem', 
                    borderBottom: '1px solid #333333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h3 style={{ color: '#ffffff', margin: 0 }}>AI Assistant</h3>
                    <button 
                      onClick={() => setIsChatOpen(false)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#ff6b35', 
                        cursor: 'pointer',
                        fontSize: '1.2rem'
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Messages */}
                  <div style={{ 
                    flex: 1, 
                    padding: '1rem', 
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    {messages.length === 0 && (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#cccccc',
                        marginTop: '2rem'
                      }}>
                        <p>👋 Hi! I'm here to help you find the perfect phone. What are you looking for?</p>
                      </div>
                    )}
                    
                    {messages.map((message, index) => (
                      <div key={index} style={{ 
                        alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%'
                      }}>
                        <div style={{ 
                          backgroundColor: message.role === 'user' ? '#ff6b35' : '#2d2d2d',
                          color: '#ffffff',
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          fontSize: '0.95rem',
                          lineHeight: '1.4'
                        }}>
                          {message.content}
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div style={{ alignSelf: 'flex-start' }}>
                        <div style={{ 
                          backgroundColor: '#2d2d2d',
                          color: '#cccccc',
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          fontSize: '0.95rem'
                        }}>
                          AI is typing...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div style={{ 
                    padding: '1rem', 
                    borderTop: '1px solid #333333',
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask about phones..."
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        backgroundColor: '#2d2d2d',
                        border: '1px solid #333333',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.95rem'
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      style={{
                        backgroundColor: '#ff6b35',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.95rem'
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Side Panel */}
            {isChatOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Quick Suggestions */}
                <div style={{ 
                  backgroundColor: '#1a1a1a', 
                  padding: '1.5rem', 
                  borderRadius: '12px',
                  border: '1px solid #333333'
                }}>
                  <h3 style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold', 
                    marginBottom: '1rem',
                    color: '#ffffff'
                  }}>
                    Quick Suggestions
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInputMessage(suggestion);
                          handleSendMessage();
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#cccccc',
                          border: '1px solid #333333',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          textAlign: 'left',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Comparisons */}
                <div style={{ 
                  backgroundColor: '#1a1a1a', 
                  padding: '1.5rem', 
                  borderRadius: '12px',
                  border: '1px solid #333333'
                }}>
                  <h3 style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold', 
                    marginBottom: '1rem',
                    color: '#ffffff'
                  }}>
                    Popular Comparisons
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      'iPhone 15 vs Samsung Galaxy S24',
                      'OnePlus 12 vs Xiaomi 14',
                      'Realme GT 6 vs Nothing Phone 2'
                    ].map((comparison, index) => (
                      <div key={index} style={{ 
                        color: '#cccccc', 
                        fontSize: '0.85rem',
                        padding: '0.5rem 0',
                        borderBottom: index < 2 ? '1px solid #333333' : 'none'
                      }}>
                        {comparison}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '2rem', marginBottom: '3rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ 
            backgroundColor: '#1a1a1a', 
            padding: '2rem', 
            borderRadius: '12px',
            border: '1px solid #333333'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: '#ffffff'
            }}>
              Detailed Specifications
            </h3>
            <p style={{ 
              color: '#cccccc', 
              lineHeight: '1.6'
            }}>
              Compare every aspect from display quality to battery life with precise technical details.
            </p>
          </div>

          <div style={{ 
            backgroundColor: '#1a1a1a', 
            padding: '2rem', 
            borderRadius: '12px',
            border: '1px solid #333333'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💰</div>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: '#ffffff'
            }}>
              Real-time Pricing
            </h3>
            <p style={{ 
              color: '#cccccc', 
              lineHeight: '1.6'
            }}>
              Get the latest prices from multiple retailers and find the best deals available.
            </p>
          </div>

          <div style={{ 
            backgroundColor: '#1a1a1a', 
            padding: '2rem', 
            borderRadius: '12px',
            border: '1px solid #333333'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⭐</div>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: '#ffffff'
            }}>
              Expert Reviews
            </h3>
            <p style={{ 
              color: '#cccccc', 
              lineHeight: '1.6'
            }}>
              Access professional reviews and user ratings to make informed decisions.
            </p>
          </div>
        </div>
      </section>


      </div>
    </>
  );
}

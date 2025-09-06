'use client';

import React from 'react';

export function TestPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000000', 
      color: '#ffffff',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '4rem', 
          fontWeight: 'bold', 
          marginBottom: '2rem' 
        }}>
          <span style={{ color: '#ff6b35' }}>Mobile</span>
          <span style={{ color: '#ffffff' }}>Matrix</span>
        </h1>
        
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#cccccc', 
          marginBottom: '3rem',
          maxWidth: '600px',
          margin: '0 auto 3rem auto',
          lineHeight: '1.6'
        }}>
          AI-powered phone comparison platform that helps you make the perfect choice. 
          Compare specifications, prices, and features across all brands launched in India.
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>AI-Powered</h3>
            <p style={{ fontSize: '0.875rem', color: '#999999' }}>Smart recommendations based on your needs</p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Detailed Comparison</h3>
            <p style={{ fontSize: '0.875rem', color: '#999999' }}>Side-by-side specs and analysis</p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🇮🇳</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>India-Focused</h3>
            <p style={{ fontSize: '0.875rem', color: '#999999' }}>Latest phones and Indian pricing</p>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '4rem'
        }}>
          <button style={{
            backgroundColor: '#ff6b35',
            color: '#ffffff',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer'
          }}>
            Start Comparing Now
          </button>
          
          <button style={{
            backgroundColor: 'transparent',
            color: '#ff6b35',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            border: '2px solid #ff6b35',
            cursor: 'pointer'
          }}>
            Browse All Phones
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '2rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b35', marginBottom: '0.25rem' }}>200+</div>
            <div style={{ fontSize: '0.875rem', color: '#999999' }}>Phone Models</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b35', marginBottom: '0.25rem' }}>15+</div>
            <div style={{ fontSize: '0.875rem', color: '#999999' }}>Brands</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b35', marginBottom: '0.25rem' }}>50K+</div>
            <div style={{ fontSize: '0.875rem', color: '#999999' }}>Comparisons</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b35', marginBottom: '0.25rem' }}>99%</div>
            <div style={{ fontSize: '0.875rem', color: '#999999' }}>Accuracy</div>
          </div>
        </div>
      </div>
    </div>
  );
}
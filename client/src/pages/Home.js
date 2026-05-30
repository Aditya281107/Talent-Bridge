import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [counters, setCounters] = useState({ jobs: 0, companies: 0, seekers: 0 });

  useEffect(() => {
    const targets = { jobs: 2500, companies: 450, seekers: 15000 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounters({
        jobs: Math.round(targets.jobs * eased),
        companies: Math.round(targets.companies * eased),
        seekers: Math.round(targets.seekers * eased),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: '🎯',
      title: 'Smart Job Matching',
      desc: 'Our intelligent algorithms connect the right talent with the perfect opportunities based on skills and experience.',
    },
    {
      icon: '⚡',
      title: 'Instant Applications',
      desc: 'Apply to multiple jobs with one click. Track your application status in real-time from your dashboard.',
    },
    {
      icon: '🏢',
      title: 'Verified Companies',
      desc: 'Every employer on our platform is verified to ensure you\'re connecting with legitimate opportunities.',
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      desc: 'Powerful insights for both job seekers and employers to make data-driven career and hiring decisions.',
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      desc: 'Your data is encrypted and protected. Control what employers see and manage your privacy settings.',
    },
    {
      icon: '🌐',
      title: 'Global Reach',
      desc: 'Access opportunities worldwide. Remote, hybrid, or on-site positions from companies across the globe.',
    },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
          <div className="hero-grid-bg"></div>
        </div>

        <div className="container hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            The Future of Recruitment
          </div>

          <h1 className="hero-title">
            Where <span className="gradient-text">Exceptional Talent</span>
            <br />
            Meets Great Opportunity
          </h1>

          <p className="hero-subtitle">
            TalentBridge connects ambitious professionals with forward-thinking
            companies. Discover your next career milestone or find the perfect
            candidate to grow your team.
          </p>

          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <Link to="/jobs" className="btn btn-primary btn-lg">
                  Browse Jobs →
                </Link>
                <Link to="/dashboard" className="btn btn-secondary btn-lg">
                  Go to Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started Free →
                </Link>
                <Link to="/jobs" className="btn btn-secondary btn-lg">
                  Browse Jobs
                </Link>
              </>
            )}
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">{counters.jobs.toLocaleString()}+</span>
              <span className="hero-stat-label">Active Jobs</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-value">{counters.companies.toLocaleString()}+</span>
              <span className="hero-stat-label">Companies</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-value">{counters.seekers.toLocaleString()}+</span>
              <span className="hero-stat-label">Job Seekers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">
              Everything You Need to
              <br />
              <span className="gradient-text">Succeed</span>
            </h2>
            <p className="section-subtitle">
              Powerful tools and features designed to streamline your job search
              or hiring process.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">How It Works</span>
            <h2 className="section-title">
              Start in <span className="gradient-text">3 Simple Steps</span>
            </h2>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3 className="step-title">Create Your Profile</h3>
              <p className="step-desc">
                Sign up in seconds. Build a profile that showcases your skills,
                experience, and career goals.
              </p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3 className="step-title">Explore & Apply</h3>
              <p className="step-desc">
                Browse through curated job listings. Filter by role, location,
                salary, and more. Apply with one click.
              </p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3 className="step-title">Get Hired</h3>
              <p className="step-desc">
                Track your applications in real-time. Get notified when employers
                review your profile. Land your dream job.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-bg-orb"></div>
            <h2 className="cta-title">
              Ready to Bridge the Gap to Your
              <br />
              <span className="gradient-text">Dream Career?</span>
            </h2>
            <p className="cta-subtitle">
              Join thousands of professionals and companies already using
              TalentBridge to find their perfect match.
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Free Account →
              </Link>
              <Link to="/jobs" className="btn btn-outline btn-lg">
                Explore Jobs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

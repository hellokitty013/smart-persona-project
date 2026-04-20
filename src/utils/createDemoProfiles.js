// Utility to create demo PROFESSIONAL profiles for testing Explore page
// This creates LinkedIn-style professional profiles (separate from Personal/Vtree/Resume)
import { createProfessionalProfile, updateProfessionalProfile } from '../services/professionalProfileManager'

export function createDemoProfessionalProfiles() {
  const demoData = [
    {
      username: 'johndoe_dev',
      data: {
        displayName: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        location: 'Bangkok, Thailand',
        experienceYears: 5,
        about: 'Passionate software engineer with 5+ years of experience in web development. Specialized in React, Node.js, and cloud technologies. Love building scalable applications and mentoring junior developers.',
        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=0D47A1&color=fff&size=200',
        coverColor: '#1a237e',
        skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB', 'Docker'],
        experience: [
          {
            position: 'Senior Software Engineer',
            company: 'Tech Startup Co.',
            location: 'Bangkok, Thailand',
            startDate: '2021-01',
            endDate: 'Present',
            description: 'Lead development of web applications using React and Node.js',
            bullets: ['Built scalable microservices', 'Mentored 5 junior developers', 'Improved performance by 40%']
          },
          {
            position: 'Software Engineer',
            company: 'Digital Agency',
            location: 'Bangkok, Thailand',
            startDate: '2019-06',
            endDate: '2020-12',
            description: 'Developed client websites and web applications',
            bullets: ['Delivered 15+ projects', 'Implemented CI/CD pipelines']
          }
        ],
        education: [
          {
            degree: 'B.S. Computer Science',
            school: 'Chulalongkorn University',
            location: 'Bangkok, Thailand',
            startDate: '2015',
            endDate: '2019',
            coursework: 'Data Structures, Algorithms, Web Development, Database Systems'
          }
        ],
        isPublic: true
      }
    },
    {
      username: 'jane_design',
      data: {
        displayName: 'Jane Smith',
        jobTitle: 'UX/UI Designer',
        location: 'Chiang Mai, Thailand',
        experienceYears: 3,
        about: 'Creative UX/UI designer focused on creating beautiful and intuitive user experiences. Love working with startups and innovative products. Believer in user-centered design.',
        avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=D32F2F&color=fff&size=200',
        coverColor: '#c62828',
        skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Design Systems'],
        experience: [
          {
            position: 'UX/UI Designer',
            company: 'Creative Studio',
            location: 'Chiang Mai, Thailand',
            startDate: '2022-03',
            endDate: 'Present',
            description: 'Design user interfaces for mobile and web applications',
            bullets: ['Conducted 20+ user research sessions', 'Built design system from scratch', 'Improved user satisfaction by 35%']
          }
        ],
        education: [
          {
            degree: 'B.A. Graphic Design',
            school: 'Silpakorn University',
            location: 'Bangkok, Thailand',
            startDate: '2018',
            endDate: '2022',
            coursework: 'Visual Design, Typography, User Experience, Digital Media'
          }
        ],
        isPublic: true
      }
    },
    {
      username: 'alex_pm',
      data: {
        displayName: 'Alex Chen',
        jobTitle: 'Product Manager',
        location: 'Bangkok, Thailand',
        experienceYears: 6,
        about: 'Experienced product manager with a track record of launching successful products. Strong in strategy, user research, and agile methodologies. Passionate about solving real user problems.',
        avatar: 'https://ui-avatars.com/api/?name=Alex+Chen&background=7B1FA2&color=fff&size=200',
        coverColor: '#6a1b9a',
        skills: ['Product Strategy', 'Agile', 'Data Analysis', 'User Research', 'Roadmapping'],
        experience: [
          {
            position: 'Senior Product Manager',
            company: 'E-commerce Platform',
            location: 'Bangkok, Thailand',
            startDate: '2020-01',
            endDate: 'Present',
            description: 'Lead product strategy and roadmap for marketplace platform',
            bullets: ['Launched 3 major features', 'Grew revenue by 50%', 'Managed team of 8 engineers']
          },
          {
            position: 'Product Manager',
            company: 'Fintech Startup',
            location: 'Singapore',
            startDate: '2018-06',
            endDate: '2019-12',
            description: 'Product management for mobile banking app',
            bullets: ['Achieved 100K users in 6 months', 'Led agile sprints']
          }
        ],
        education: [
          {
            degree: 'MBA',
            school: 'NIDA',
            location: 'Bangkok, Thailand',
            startDate: '2016',
            endDate: '2018',
            coursework: 'Business Strategy, Marketing, Finance'
          }
        ],
        isPublic: true
      }
    },
    {
      username: 'sarah_data',
      data: {
        displayName: 'Sarah Lee',
        jobTitle: 'Data Scientist',
        location: 'Singapore',
        experienceYears: 4,
        about: 'Data scientist passionate about machine learning and AI. Experience in predictive modeling, NLP, and computer vision. Love turning data into actionable insights.',
        avatar: 'https://ui-avatars.com/api/?name=Sarah+Lee&background=388E3C&color=fff&size=200',
        coverColor: '#2e7d32',
        skills: ['Python', 'TensorFlow', 'Machine Learning', 'Data Visualization', 'SQL', 'R'],
        experience: [
          {
            position: 'Data Scientist',
            company: 'Tech Giant',
            location: 'Singapore',
            startDate: '2021-01',
            endDate: 'Present',
            description: 'Build ML models for recommendation systems',
            bullets: ['Improved recommendation accuracy by 25%', 'Deployed 5 ML models to production', 'Published 2 research papers']
          }
        ],
        education: [
          {
            degree: 'M.S. Data Science',
            school: 'NUS',
            location: 'Singapore',
            startDate: '2019',
            endDate: '2021',
            coursework: 'Machine Learning, Deep Learning, Big Data Analytics'
          }
        ],
        isPublic: true
      }
    },
    {
      username: 'mike_frontend',
      data: {
        displayName: 'Mike Johnson',
        jobTitle: 'Frontend Developer',
        location: 'Bangkok, Thailand',
        experienceYears: 2,
        about: 'Junior frontend developer eager to learn and grow. Specializing in modern web technologies and responsive design. Always excited about new JavaScript frameworks.',
        avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=F57C00&color=fff&size=200',
        coverColor: '#ef6c00',
        skills: ['React', 'JavaScript', 'CSS', 'HTML5', 'Git', 'Responsive Design'],
        experience: [
          {
            position: 'Frontend Developer',
            company: 'Web Agency',
            location: 'Bangkok, Thailand',
            startDate: '2023-06',
            endDate: 'Present',
            description: 'Develop responsive websites and web applications',
            bullets: ['Built 10+ client websites', 'Implemented modern CSS techniques', 'Collaborated with designers']
          }
        ],
        education: [
          {
            degree: 'B.S. Information Technology',
            school: 'KMUTT',
            location: 'Bangkok, Thailand',
            startDate: '2019',
            endDate: '2023',
            coursework: 'Web Development, Database, Software Engineering'
          }
        ],
        isPublic: true
      }
    },
    {
      username: 'lisa_devops',
      data: {
        displayName: 'Lisa Wang',
        jobTitle: 'DevOps Engineer',
        location: 'Hong Kong',
        experienceYears: 7,
        about: 'Senior DevOps engineer with expertise in cloud infrastructure, CI/CD, and automation. Love optimizing development workflows and building reliable systems.',
        avatar: 'https://ui-avatars.com/api/?name=Lisa+Wang&background=1976D2&color=fff&size=200',
        coverColor: '#1565c0',
        skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Linux'],
        experience: [
          {
            position: 'Senior DevOps Engineer',
            company: 'Cloud Services Inc.',
            location: 'Hong Kong',
            startDate: '2020-01',
            endDate: 'Present',
            description: 'Manage cloud infrastructure and deployment pipelines',
            bullets: ['Reduced deployment time by 60%', 'Managed Kubernetes clusters', 'Saved $100K in cloud costs']
          },
          {
            position: 'DevOps Engineer',
            company: 'Startup',
            location: 'Hong Kong',
            startDate: '2018-01',
            endDate: '2019-12',
            description: 'Built CI/CD pipelines and infrastructure automation',
            bullets: ['Implemented GitOps workflow', 'Automated infrastructure provisioning']
          }
        ],
        education: [
          {
            degree: 'B.S. Computer Engineering',
            school: 'HKUST',
            location: 'Hong Kong',
            startDate: '2014',
            endDate: '2018',
            coursework: 'Operating Systems, Networks, Cloud Computing'
          }
        ],
        isPublic: true
      }
    }
  ]

  const createdProfiles = []
  
  demoData.forEach(demo => {
    const profile = createProfessionalProfile(demo.username)
    updateProfessionalProfile(profile.id, demo.data)
    createdProfiles.push(profile)
    console.log(`Created demo professional profile: ${demo.data.displayName}`)
  })

  return createdProfiles
}

// Call this function in browser console to create demo profiles:
// import { createDemoProfiles } from './utils/createDemoProfiles'
// createDemoProfiles()


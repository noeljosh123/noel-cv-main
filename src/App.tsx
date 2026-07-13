/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Github, Linkedin, Facebook } from 'lucide-react';
import Chatbot from './Chatbot.tsx';

type TransitionDirection = 'to-light' | 'to-dark' | null;

const ProfileTransitionMedia = ({
  isDarkMode,
  isPlaying,
  transitionDirection,
  darkToLightRef,
  lightToDarkRef,
  onDarkToLightEnded,
  onLightToDarkEnded,
}: {
  isDarkMode: boolean;
  isPlaying: boolean;
  transitionDirection: TransitionDirection;
  darkToLightRef: React.RefObject<HTMLVideoElement | null>;
  lightToDarkRef: React.RefObject<HTMLVideoElement | null>;
  onDarkToLightEnded: () => void;
  onLightToDarkEnded: () => void;
}) => {
  const idleMode =
    transitionDirection === 'to-dark'
      ? 'dark'
      : transitionDirection === 'to-light'
        ? 'light'
        : isDarkMode
          ? 'dark'
          : 'light';

  const showDarkImage = !isPlaying && idleMode === 'dark';
  const showLightImage = !isPlaying && idleMode === 'light';
  const showDarkToLightVideo = isPlaying && transitionDirection === 'to-light';
  const showLightToDarkVideo = isPlaying && transitionDirection === 'to-dark';

  return (
    <div className="relative w-36 h-36 md:w-40 md:h-40 min-w-[144px] min-h-[144px] md:min-w-[160px] md:min-h-[160px] shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-surface">
      <img
        alt="Noel Josh Casin dark"
        src="/assets/dark-mode.jpg"
        className={`absolute inset-0 w-full h-full rounded-lg object-cover scale-[1.02] transition-opacity duration-300 pointer-events-none ${showDarkImage ? 'opacity-100' : 'opacity-0'}`}
      />
      <img
        alt="Noel Josh Casin light"
        src="/assets/light-mode.jpg"
        className={`absolute inset-0 w-full h-full rounded-lg object-cover scale-[1.02] transition-opacity duration-300 pointer-events-none ${showLightImage ? 'opacity-100' : 'opacity-0'}`}
      />
      <video
        ref={darkToLightRef}
        src="/assets/Dark%20to%20light%202.mp4"
        muted
        autoPlay={false}
        playsInline
        preload="auto"
        onEnded={onDarkToLightEnded}
        className={`absolute inset-0 w-full h-full rounded-lg object-cover scale-[1.02] transition-opacity duration-300 pointer-events-none ${showDarkToLightVideo ? 'opacity-100' : 'opacity-0'}`}
      />
      <video
        ref={lightToDarkRef}
        src="/assets/Light%20to%20dark%202.mp4"
        muted
        autoPlay={false}
        playsInline
        preload="auto"
        onEnded={onLightToDarkEnded}
        className={`absolute inset-0 w-full h-full rounded-lg object-cover scale-[1.02] transition-opacity duration-300 pointer-events-none ${showLightToDarkVideo ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

const ProfileHeader = ({
  isDarkMode,
  isPlaying,
  setIsPlaying,
  setIsDarkMode,
}: {
  isDarkMode: boolean;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const darkToLightRef = useRef<HTMLVideoElement>(null);
  const lightToDarkRef = useRef<HTMLVideoElement>(null);
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>(null);

  const resetVideos = () => {
    if (darkToLightRef.current) {
      darkToLightRef.current.pause();
      darkToLightRef.current.currentTime = 0;
    }

    if (lightToDarkRef.current) {
      lightToDarkRef.current.pause();
      lightToDarkRef.current.currentTime = 0;
    }
  };

  const settleThemeAfterTransition = () => {
    setIsPlaying(false);
    setTransitionDirection(null);
  };

  const handleDarkToLightEnded = () => {
    settleThemeAfterTransition();
  };

  const handleLightToDarkEnded = () => {
    settleThemeAfterTransition();
  };

  const playTransitionVideo = (direction: Exclude<TransitionDirection, null>) => {
    const video = direction === 'to-light' ? darkToLightRef.current : lightToDarkRef.current;
    const nextDarkMode = direction === 'to-dark';

    if (!video) {
      settleThemeAfterTransition();
      return;
    }

    resetVideos();

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        settleThemeAfterTransition();
      });
    }
  };

  const handleToggleDarkMode = () => {
    if (isPlaying) {
      return;
    }

    const nextDirection: Exclude<TransitionDirection, null> = isDarkMode ? 'to-light' : 'to-dark';
    const nextDarkMode = nextDirection === 'to-dark';

    // Update global theme immediately; video now acts as a visual transition only.
    setIsDarkMode(nextDarkMode);
    setTransitionDirection(nextDirection);
    setIsPlaying(true);
    playTransitionVideo(nextDirection);
  };

  return (
    <section id="profile" className="p-8 md:p-9">
      <div className="flex flex-col md:flex-row items-start gap-4 mb-6 w-full">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <ProfileTransitionMedia
            isDarkMode={isDarkMode}
            isPlaying={isPlaying}
            transitionDirection={transitionDirection}
            darkToLightRef={darkToLightRef}
            lightToDarkRef={lightToDarkRef}
            onDarkToLightEnded={handleDarkToLightEnded}
            onLightToDarkEnded={handleLightToDarkEnded}
          />
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-1">Noel Josh Casin</h1>
            <p className="text-on-surface-variant flex items-center gap-1 text-base">
              <span className="material-symbols-outlined text-base">location_on</span> Mandaluyong, Philippines
            </p>
            <p className="text-sm font-medium text-on-surface-variant/80 mt-1.5">CS / AI / Full stack AI</p>
            <div className="mt-3 inline-flex items-center gap-2.5 rounded-lg px-3.5 py-2 border border-outline-variant/30 bg-gradient-to-r from-surface-container to-surface-container-high shadow-sm">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">school</span>
              <span className="text-xs font-extrabold tracking-wide text-on-surface">FEU Tech CS '26</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 pt-3 border-t border-outline-variant/10 justify-between items-center">
        <div className="flex flex-wrap gap-3">
          <a href="/Noel_Josh_Casin_Resume.pdf" download className="bg-surface border border-outline-variant/30 text-on-surface px-6 py-2.5 rounded-full text-sm font-bold hover:bg-surface-container-low transition-all flex items-center gap-2"><span className="material-symbols-outlined text-sm">download</span>Download CV</a>
          <a href="https://mail.google.com/mail/?view=cm&fs=1&to=noeljoshcasin@gmail.com" target="_blank" rel="noopener noreferrer" className="bg-surface border border-outline-variant/30 text-on-surface px-6 py-2.5 rounded-full text-sm font-bold hover:bg-surface-container-low transition-all flex items-center gap-2"><span className="material-symbols-outlined text-sm">mail</span>Send Email</a>
        </div>
        <button
          onClick={handleToggleDarkMode}
          disabled={isPlaying}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant hover:text-on-surface hover:border-outline transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-base leading-none" aria-hidden="true">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
          <span className="ml-1">Theme</span>
        </button>
      </div>
    </section>
  );
};

const About = () => (
  <section id="about" className="space-y-3">
    <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant/60">About</h2>
    <p className="text-lg leading-relaxed font-body text-on-surface/90">
      I am a Computer Science student at FEU Institute of Technology, expected to graduate in 2026, and an aspiring Full-Stack AI Engineer. I specialize in building scalable web applications and actively integrate emerging AI tools to optimize my development workflows. Recently, I interned as an Automation Developer at Reed Elsevier (RELX), where I engineered dynamic dashboards and resource-tracking systems using Python, Django, and React.
    </p>
  </section>
);

const TechStack = () => (
  <section id="tech-stack" className="space-y-4">
    <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant/60">Tech Stack</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="p-3 bg-surface-container-low rounded-DEFAULT border border-outline-variant/5">
        <span className="block text-sm font-bold mb-1">Languages</span>
        <span className="text-xs text-on-surface-variant">Python, C++, Java, Dart, JavaScript, TypeScript, HTML, CSS</span>
      </div>
      <div className="p-3 bg-surface-container-low rounded-DEFAULT border border-outline-variant/5">
        <span className="block text-sm font-bold mb-1">Frontend</span>
        <span className="text-xs text-on-surface-variant">React, Tailwind CSS, Vite</span>
      </div>
      <div className="p-3 bg-surface-container-low rounded-DEFAULT border border-outline-variant/5">
        <span className="block text-sm font-bold mb-1">Backend</span>
        <span className="text-xs text-on-surface-variant">Django, Django Ninja, SQL, Firebase, Supabase</span>
      </div>
      <div className="p-3 bg-surface-container-low rounded-DEFAULT border border-outline-variant/5">
        <span className="block text-sm font-bold mb-1">Skills</span>
        <span className="text-xs text-on-surface-variant">Power Platform, Project Management</span>
      </div>
    </div>
  </section>
);

const projects = [
  {
    id: 'carabuddy',
    title: 'CaraBuddy',
    shortDesc: 'A secure, local-first personal finance application for stress-free budget management.',
    longDesc: 'Developed a secure, local-first mobile application focused on delivering a stress-free budget management experience. Leveraged Supabase as the backend, handling database management, authentication, and real-time data synchronization while keeping user data private and fully controlled. Architected the application to prioritize user privacy and data control, ensuring all personal financial data remains localized.',
    tags: ['SUPABASE', 'MOBILE', 'LOCAL-FIRST', 'FINANCE'],
    repo: 'https://cara-buddy.vercel.app/'
  },
  {
    id: 'roadry',
    title: 'RoaDry',
    shortDesc: 'Real-Time Flood Monitoring and Safe Route Optimization in Metro Manila.',
    longDesc: 'Led and coordinated a multidisciplinary team throughout system programming and research documentation. Learned and implemented Dart for cross-platform mobile development. Configured Firebase for robust database management. Integrated Azure Vision AI for advanced image processing to accurately detect flood scenarios. Developed APIs and utilized web scraping with NLP to aggregate safety data. Applied Dijkstra\'s algorithm to compute the shortest and safest travel routes.',
    tags: ['DART', 'FIREBASE', 'AZURE AI', 'NLP', 'DIJKSTRA'],
    repo: '/Moby%20Time%20poster.jpg'
  },
  {
    id: 'kwikslot',
    title: 'KwikSlot',
    shortDesc: 'A modern full-stack cinema booking platform with interactive seat mapping.',
    longDesc: 'Developed a modern full-stack cinema booking platform featuring a complete booking flow, interactive seat mapping, and a comprehensive admin dashboard. Architected a modular React and TypeScript application with Context API and Tailwind CSS. Engineered an interactive 8×10 seat grid component with VIP pricing tier logic and real-time booking conflict resolution simulation. Built a multi-step checkout flow with payment simulation.',
    tags: ['REACT', 'TYPESCRIPT', 'TAILWIND CSS', 'VITE'],
    repo: 'https://cine-verse-omega-eight.vercel.app/'
  }
];

const resumeProjects = [
  {
    id: 'devutil-v2',
    title: 'Resource Tracker (DEVUTIL v2)',
    shortDesc: 'A full-stack internal tool that replaced manual Excel-based resource tracking.',
    longDesc: 'Built the application end-to-end during internship, implementing a Python and Django Ninja backend with a React frontend connected to SQL. Delivered real-time resource allocation and editing workflows for team operations.',
    tags: ['PYTHON', 'DJANGO NINJA', 'REACT', 'SQL', 'INTERNAL TOOL'],
    repo: '#'
  },
  {
    id: 'osp-engagement-oversight',
    title: 'OSP Tool (Engagement Oversight)',
    shortDesc: 'A centralized dashboard for project tracking, expense visibility, and burn-rate monitoring.',
    longDesc: 'Architected and implemented the frontend using React and TypeScript with Node.js support, integrated with Python and Django services. The platform streamlined project progress, cost tracking, and reporting for enterprise workflows.',
    tags: ['REACT', 'TYPESCRIPT', 'NODE.JS', 'DJANGO', 'DASHBOARD'],
    repo: '#'
  },
  {
    id: 'process-landscaping',
    title: 'Process Landscaping (PL APP)',
    shortDesc: 'A centralized workflow visualization tool focusing on frontend design and backend integration.',
    longDesc: 'Collaborated with a colleague to build a web tool for process mapping and visualization. Focused on frontend design and connected endpoints from the backend. We helped each other across the full stack to deliver the application.',
    tags: ['REACT', 'FRONTEND', 'PYTHON', 'COLLABORATION'],
    repo: '#'
  }
];

const allProjects = [...projects, ...resumeProjects];

const ProjectCard = ({ project }: { project: any; key?: React.Key }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExternalLink = typeof project.repo === 'string' && project.repo !== '#';

  return (
    <motion.div
      layout="position"
      whileHover={{ scale: 1.01, translateY: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => setIsExpanded(!isExpanded)}
      className="break-inside-avoid mb-4 md:mb-5 group p-4 bg-surface border border-outline-variant/20 rounded-xl hover:bg-on-surface/5 hover:shadow-md cursor-pointer overflow-hidden flex flex-col gap-3"
    >
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold">{project.title}</h3>
        <span className="material-symbols-outlined text-outline-variant group-hover:text-on-surface transition-colors">
          {isExpanded ? 'expand_less' : 'north_east'}
        </span>
      </div>

      <p className="text-on-surface-variant text-sm leading-relaxed">
        {isExpanded ? project.longDesc : project.shortDesc}
      </p>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-4">
              {hasExternalLink ? (
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-on-surface hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">code</span>
                  Open Link
                </a>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant/80">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Internal / Resume Project
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2 mt-auto">
        {(isExpanded ? project.tags : project.tags.slice(0, 3)).map((tag: string) => (
          <span key={tag} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-surface-variant text-on-surface rounded">
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

const RecentProjects = () => (
  <section id="projects" className="space-y-4">
    <div className="flex justify-between items-end">
      <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant/60">Projects</h2>
      <a className="text-xs font-bold text-on-surface uppercase tracking-wider hover:opacity-70 transition-opacity flex items-center gap-1" href="/projects">
        View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </a>
    </div>
    <div className="space-y-3">
      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  </section>
);

const AllProjectsPage = () => (
  <div className="bg-surface text-on-surface min-h-screen transition-colors duration-300 py-6 md:py-8">
    <main className="mx-auto w-full max-w-[var(--layout-max-width)] px-[var(--layout-gutter-mobile)] lg:px-[var(--layout-gutter-desktop)] 2xl:px-[var(--layout-gutter-xl)]">
      <section className="space-y-6">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Portfolio
        </a>
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">All Projects</h1>
          <p className="text-sm text-on-surface-variant max-w-2xl">
            Complete project list based on portfolio and resume experience.
          </p>
        </div>
        <div className="columns-1 md:columns-2 gap-4 md:gap-5 pb-8">
          {allProjects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      </section>
    </main>
    <Chatbot />
  </div>
);

const Education = () => (
  <section id="education" className="space-y-4">
    <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant/60">Education</h2>
    <div className="space-y-4">
      <div className="p-4 bg-surface border border-outline-variant/20 rounded-DEFAULT">
        <h3 className="text-xl font-bold">FEU Institute of Technology</h3>
        <p className="text-sm text-on-surface font-bold mt-1 mb-2">Bachelor of Science in Computer Science</p>
        <p className="text-xs text-on-surface-variant mb-3">Expected 2026 · Manila, Philippines</p>
        <div className="space-y-2">
          <p className="text-sm text-on-surface/90 leading-relaxed">
            <span className="font-bold">Thesis:</span> RoaDry: Real-Time Flood Monitoring and Safe Route Optimization in Metro Manila Using Crowdsourcing, Web Scraping, and Graph-Based Algorithms for Android and iOS.
          </p>
          <p className="text-sm text-on-surface/90 leading-relaxed">
            <span className="font-bold">Relevant Coursework:</span> Object-Oriented Programming (Python, C++, Java), Data Structures, Algorithms, Machine Learning, Web Development (HTML, CSS, PHP), Mobile Application Development.
          </p>
        </div>
      </div>
      <div className="p-4 bg-surface border border-outline-variant/20 rounded-DEFAULT">
        <h3 className="text-xl font-bold">San Felipe Neri Catholic School</h3>
        <p className="text-sm text-on-surface font-bold mt-1 mb-2">Science, Technology, Engineering, and Mathematics</p>
        <p className="text-xs text-on-surface-variant">2022 · Mandaluyong, Philippines</p>
      </div>
    </div>
  </section>
);

const Gallery = () => {
  // Bento layout for 4 images: 1 large hero + 2 stacked right + 1 wide bottom
  const bentoConfig = [
    { src: '/assets/galley 1.jpg', cls: 'col-span-2 md:col-span-4 row-span-2' }, // large hero
    { src: '/assets/gallery 2.jpg', cls: 'col-span-2 md:col-span-2 row-span-1' }, // top-right
    { src: '/assets/gallery 3.jpg', cls: 'col-span-2 md:col-span-2 row-span-1' }, // mid-right
    { src: '/assets/gallery 4.jpg', cls: 'col-span-2 md:col-span-3 row-span-2' }, // bottom-left
    { src: '/assets/gallery 5.jpg', cls: 'col-span-2 md:col-span-3 row-span-2' }, // bottom-right
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <section id="gallery" className="space-y-4">
      <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant/60">Gallery</h2>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        className="grid grid-cols-4 md:grid-cols-6 auto-rows-[100px] md:auto-rows-[120px] gap-2.5"
      >
        {bentoConfig.map((item, index) => (
          <motion.div
            key={`gallery-item-${index}`}
            variants={itemVariants}
            className={`relative overflow-hidden rounded-xl bg-surface-container-low border border-outline-variant/20 group cursor-zoom-in ${item.cls}`}
            onClick={() => window.open(item.src, '_blank')}
          >
            <img
              src={item.src}
              alt={`Gallery ${index + 1}`}
              className="absolute inset-0 w-full h-full object-cover z-10 transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-end justify-end p-3">
              <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                <span className="material-symbols-outlined icon-sm">open_in_full</span>
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

const Experience = () => (
  <section id="experience" className="space-y-4">
    <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant/60">Experience</h2>
    <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-outline-variant/20">
      <div className="relative pl-7">
        <div className="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-on-surface-variant"></div>
        </div>
        <h4 className="text-sm font-bold">Automation Developer Intern</h4>
        <p className="text-xs text-on-surface-variant mb-2">Reed Elsevier (RELX) · Dec 2025 — Mar 2026</p>
        <ul className="text-xs leading-relaxed text-on-surface/80 space-y-2 list-disc ml-4">
          <li><strong>Resource Tracker (DEVUTIL v2):</strong> Developed the full-stack web application end-to-end, handling both frontend and backend, to replace the manual Excel-based employee hour-tracking workflow. Built the backend using Python and Django Ninja, and the frontend with React and JavaScript, connected to a SQL database. Enabled real-time resource allocation and editing capabilities.</li>
          <li><strong>OSP Tool (Engagement Oversight):</strong> Architected and built the frontend using React, TypeScript, and Node.js, backed by Python and Django on the server side. Delivered a centralized dashboard to streamline project progress tracking, expense calculation, and financial burn rate monitoring. Integrated Power Platform components to align the application with the broader corporate enterprise ecosystem.</li>
          <li><strong>Process Landscaping (PL APP):</strong> Focused on the Frontend Design of the web tool and connected endpoints from the backend. Collaborated closely with a colleague (who focused on the backend) in a partnership where we helped each other out on both the frontend and backend from time to time.</li>
        </ul>
      </div>
    </div>
  </section>
);

const Certifications = () => (
  <section id="certifications" className="space-y-3">
    <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant/60">Certifications</h2>
    <ul className="space-y-2">
      <li className="flex items-center gap-3 group">
        <span className="material-symbols-outlined text-outline-variant text-sm">workspace_premium</span>
        <span className="text-xs font-medium text-on-surface group-hover:text-on-surface-variant transition-colors">Civil Service Eligibility (Professional Level)</span>
      </li>
      <li className="flex items-center gap-3 group">
        <span className="material-symbols-outlined text-outline-variant text-sm">workspace_premium</span>
        <span className="text-xs font-medium text-on-surface group-hover:text-on-surface-variant transition-colors">CCNA: Introduction to Network</span>
      </li>
      <li className="flex items-center gap-3 group">
        <span className="material-symbols-outlined text-outline-variant text-sm">workspace_premium</span>
        <span className="text-xs font-medium text-on-surface group-hover:text-on-surface-variant transition-colors">DevNet Associate Course</span>
      </li>
      <li className="flex items-center gap-3 group">
        <span className="material-symbols-outlined text-outline-variant text-sm">workspace_premium</span>
        <span className="text-xs font-medium text-on-surface group-hover:text-on-surface-variant transition-colors">PMI Project Management</span>
      </li>
      <li className="flex items-center gap-3 group">
        <span className="material-symbols-outlined text-outline-variant text-sm">workspace_premium</span>
        <span className="text-xs font-medium text-on-surface group-hover:text-on-surface-variant transition-colors">ITS Python</span>
      </li>
    </ul>
  </section>
);

const Interests = () => (
  <section className="space-y-3">
    <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant/60">Interests & Languages</h2>
    <div className="flex flex-wrap gap-2">
      <span className="px-3 py-1 bg-surface-container-high rounded-DEFAULT text-[10px] font-bold text-on-surface-variant">Full-Stack Development</span>
      <span className="px-3 py-1 bg-surface-container-high rounded-DEFAULT text-[10px] font-bold text-on-surface-variant">Gaming</span>
      <span className="px-3 py-1 bg-surface-container-high rounded-DEFAULT text-[10px] font-bold text-on-surface-variant">English</span>
      <span className="px-3 py-1 bg-surface-container-high rounded-DEFAULT text-[10px] font-bold text-on-surface-variant">Filipino</span>
      <span className="px-3 py-1 bg-surface-container-high rounded-DEFAULT text-[10px] font-bold text-on-surface-variant">Mandarin (Basic)</span>
    </div>
  </section>
);

const SocialLinks = () => (
  <section className="space-y-3">
    <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant/60">Find me on</h2>
    <div className="flex flex-col gap-2">
      <a className="flex items-center justify-between p-2.5 bg-surface border border-outline-variant/20 rounded-DEFAULT hover:border-on-surface-variant transition-colors group" href="https://github.com/noeljosh123" target="_blank" rel="noopener noreferrer">
        <div className="flex items-center gap-3">
          <Github size={16} className="text-on-surface-variant group-hover:text-on-surface transition-colors" />
          <span className="text-xs font-bold">GitHub</span>
        </div>
        <span className="material-symbols-outlined text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">arrow_outward</span>
      </a>
      <a className="flex items-center justify-between p-2.5 bg-surface border border-outline-variant/20 rounded-DEFAULT hover:border-on-surface-variant transition-colors group" href="https://www.linkedin.com/in/noel-josh-casin-aabb9538a/" target="_blank" rel="noopener noreferrer">
        <div className="flex items-center gap-3">
          <Linkedin size={16} className="text-on-surface-variant group-hover:text-on-surface transition-colors" />
          <span className="text-xs font-bold">LinkedIn</span>
        </div>
        <span className="material-symbols-outlined text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">arrow_outward</span>
      </a>
      <a className="flex items-center justify-between p-2.5 bg-surface border border-outline-variant/20 rounded-DEFAULT hover:border-on-surface-variant transition-colors group" href="https://www.facebook.com/noeljosh.casin.5/" target="_blank" rel="noopener noreferrer">
        <div className="flex items-center gap-3">
          <Facebook size={16} className="text-on-surface-variant group-hover:text-on-surface transition-colors" />
          <span className="text-xs font-bold">Facebook</span>
        </div>
        <span className="material-symbols-outlined text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">arrow_outward</span>
      </a>
    </div>
  </section>
);

const Footer = () => (
  <footer className="w-full py-8 px-6 bg-surface-container-low">
    <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 border-t border-outline-variant/20 pt-6">
      <p className="text-xs uppercase tracking-widest font-inter text-on-surface-variant">
        Noel Josh Casin · Designed & Developed · © 2026
      </p>
      <div className="flex gap-6">
        <a className="text-xs uppercase tracking-widest font-inter text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity" href="https://github.com/noeljosh123" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a className="text-xs uppercase tracking-widest font-inter text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity" href="https://www.linkedin.com/in/noel-josh-casin-aabb9538a/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>
    </div>
  </footer>
);

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const isProjectsPage = typeof window !== 'undefined' && window.location.pathname === '/projects';

  useLayoutEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  if (isProjectsPage) {
    return <AllProjectsPage />;
  }

  return (
    <div className="bg-surface text-on-surface selection:bg-surface-container-high selection:text-on-surface min-h-screen transition-colors duration-300 py-3 md:py-6">
      <div className="mx-auto w-full max-w-[var(--layout-max-width)] px-[var(--layout-gutter-mobile)] lg:px-[var(--layout-gutter-desktop)] 2xl:px-[var(--layout-gutter-xl)]">
        <main className="pt-8 pb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column (60%) */}
            <div className="w-full lg:w-[60%] space-y-8">
              <ProfileHeader
                isDarkMode={isDarkMode}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                setIsDarkMode={setIsDarkMode}
              />
              <About />
              <TechStack />
              <RecentProjects />
              <Education />
              <Gallery />
            </div>
            {/* Right Column (38%, sticky) */}
            <aside className="w-full lg:w-[38%]">
              <div className="lg:sticky lg:top-20 space-y-7 pb-3 lg:pb-6">
                <Experience />
                <Certifications />
                <Interests />
                <SocialLinks />
              </div>
            </aside>
          </div>
        </main>
        <Footer />
        <Chatbot />
      </div>
    </div>
  );
}


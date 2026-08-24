# AZ-2008: DevOps Foundations — Student Recap & Notes

> Source: AZ-2008 Day 1 session (Meeting 108734). This recap summarises the concepts covered during the instructor-led delivery. For the hands-on implementation in this repository, see the [main README](../README.md).

## What We Learned Today

Today's training focused on **DevOps Foundations**, helping learners understand how modern teams plan, build, test, secure, and deploy applications more efficiently using GitHub, GitHub Copilot, GitHub Actions, Infrastructure as Code (IaC), and Azure services.

A key message throughout the day was:

> **DevOps is not a tool. DevOps is a culture that brings people, processes, and technology together to deliver better software faster.**

---

## 1. Understanding DevOps

We started by discussing the challenges of traditional development models where:

- Developers write code
- Operations deploy infrastructure
- Security reviews later
- Testing happens near the end

This often creates delays, silos, finger-pointing, and slower delivery cycles.

DevOps aims to solve this by encouraging:

- Collaboration
- Shared responsibility
- Transparency
- Continuous improvement
- Automation wherever possible

### Key Takeaway

DevOps works best when development, operations, testing, and security teams work together toward a common business goal rather than operating independently.

---

## 2. Agile, Scrum, and DevOps

We also reviewed how DevOps complements Agile practices.

Topics covered:

- Product Backlog
- Sprint Planning
- Daily Scrum
- Sprint Review
- Retrospectives
- Kanban Boards
- Work Items and Epics

### Why This Matters

DevOps helps teams automate delivery, while Agile helps teams organize and prioritize work.

Together they provide:

- Faster feedback
- Better planning
- Reduced blockers
- Improved team visibility

---

## 3. Git and GitHub Fundamentals

The course introduced Git and GitHub as the foundation for modern development workflows.

Topics included:

- Repositories
- Commits
- Branches
- Pull Requests
- Version Control
- GitHub Organizations
- Teams and Permissions

### Key Learning

Version control allows teams to:

- Track changes
- Restore previous versions
- Collaborate safely
- Maintain history of code changes

---

## 4. GitHub Projects and Work Management

A practical demonstration showed how GitHub Projects can be used as a Kanban-style planning tool.

Examples included:

- Creating Epics
- Creating Work Items
- Setting Priorities
- Assigning Tasks
- Tracking Progress
- Managing Sprint Workflows

### Real World Benefit

Useful for:

- Software development teams
- Infrastructure teams
- Platform engineering teams
- Data and AI projects
- Internal IT initiatives

Even non-developers can use GitHub Projects to organize work and collaborate more effectively.

---

## 5. GitHub Flow (Branching Strategy)

One of the most important concepts covered was **GitHub Flow**.

Process:

1. Start from Main branch
2. Create a new Feature Branch
3. Make changes
4. Commit code
5. Create Pull Request
6. Review changes
7. Merge back to Main
8. Delete temporary branch

### Why It Matters

GitHub Flow helps teams:

- Work in parallel
- Avoid overwriting each other's work
- Perform code reviews
- Maintain code quality
- Reduce production issues

---

## 6. GitHub Copilot for Development

GitHub Copilot was demonstrated throughout the day to accelerate development work.

Capabilities demonstrated:

- Generate source code
- Create backend APIs
- Create frontend applications
- Generate unit tests
- Fix bugs
- Explain code
- Generate CI/CD pipelines
- Review implementations

### Real World Use Cases

Useful for:

- New developers learning coding patterns
- Rapid prototyping
- Test generation
- Documentation generation
- Refactoring code
- Infrastructure automation

---

## 7. Building a Complete Weather Application

The class built a simple weather application to demonstrate end-to-end DevOps concepts.

Features included:

### Frontend

- Bootstrap UI
- Country and city views
- Weather display
- Maps integration

### Backend

- Node.js API
- REST endpoints
- Azure Maps integration
- Weather retrieval services

### Security

- Environment variables
- API key protection
- Dependency checks

---

## 8. Continuous Integration (CI)

The training introduced **GitHub Actions** and CI pipelines.

Automation examples included:

- Triggering builds
- Running tests
- Checking quality gates
- Validating pull requests
- Executing workflows automatically

### Benefits

Instead of manually testing code:

- CI validates code automatically
- Bugs are detected earlier
- Team confidence increases
- Releases become safer

---

## 9. Unit Testing

The course demonstrated automated testing using Node.js testing frameworks.

Testing concepts:

- Backend testing
- API testing
- Frontend validation
- Automated execution in GitHub Actions

### Why This Matters

Testing early reduces production defects and minimizes troubleshooting efforts later in the development lifecycle.

---

## 10. Shift Left Strategy

A recurring theme was **Shift Left**.

Instead of waiting until the end:

- Test earlier
- Scan code earlier
- Validate security earlier
- Catch issues sooner

### Benefits

- Faster feedback
- Lower cost of fixing issues
- Higher quality software
- Better security posture

---

## 11. Security and Compliance

Several GitHub security features were discussed:

### Dependabot

Automatically:

- Detects outdated dependencies
- Creates update recommendations
- Generates pull requests for version updates

### CodeQL

Automated code scanning helps identify:

- Vulnerabilities
- Unsafe coding patterns
- Security risks

### Practical Benefit

Improves software security without requiring manual code inspections for every change.

---

## 12. Infrastructure as Code (IaC)

Infrastructure provisioning was introduced using **Bicep**.

Benefits:

- Infrastructure becomes reusable
- Environments become repeatable
- Deployments become consistent
- Manual configuration errors are reduced

### Use Cases

- Creating Azure resources
- Environment provisioning
- Disaster recovery environments
- Dev/Test environments

---

## 13. Continuous Delivery (CD)

The next step after CI is CD.

Topics discussed:

- Packaging applications
- Docker containers
- GitHub Packages
- Automated deployment workflows
- Azure deployment pipelines

### Goal

Automatically move tested applications toward deployment environments safely and consistently.

---

## 14. Monitoring and Operations

The training concluded by discussing operational practices.

Topics included:

- Monitoring applications
- Telemetry
- Alerts
- Azure Monitor
- Log Analytics
- Site Reliability Engineering (SRE) concepts

### Why It Matters

DevOps does not end after deployment.

Teams must:

- Monitor applications
- Diagnose issues
- Improve reliability
- Learn from operational feedback

---

## Key Exam & Career Takeaways

After today's session, you should understand:

✅ DevOps culture and principles

✅ Git and GitHub fundamentals

✅ GitHub Flow

✅ Branches and Pull Requests

✅ GitHub Projects

✅ GitHub Copilot

✅ Continuous Integration

✅ Continuous Delivery

✅ Shift Left testing

✅ Infrastructure as Code

✅ Security automation

✅ Basic monitoring concepts

---

## Links Shared During Training

### Official Learning Path

- [DevOps Foundations Learning Path](https://learn.microsoft.com/en-us/training/paths/devops-foundations-core-principles-practices/)

### Git Installation

- [Git Download and Installation](https://git-scm.com/install/)

### Lab Environment

- [ESI Learn On Demand](https://esi.learnondemand.net/)
- [Lab Activation Guide](https://aka.ms/OSLabsSignintoSkillable)
- Microsoft Account: [Account Portal](https://account.microsoft.com/)

### GitHub Demo Repository

- [AZ-2008 DevOps Foundation Organization](https://github.com/AZ-2008-DevOps-Foundation)
- [DevOps Foundation Aug 2026 Repository](https://github.com/AZ-2008-DevOps-Foundation/DevOps-Foundation-Aug2026)
- [GitHub Project Backlog](https://github.com/orgs/AZ-2008-DevOps-Foundation/projects/3)

### Additional Learning Resource

- [Azure Animations](https://azureanimations.github.io/v2/index.html)

---

## ⚠️ Action Required: Complete Your Class Survey

Your feedback is extremely important and helps improve future training deliveries.

## Final Thoughts

Today's session showed how modern software teams can move from **planning → development → testing → security → deployment → monitoring** using GitHub and Azure-based DevOps practices. The hands-on labs provided practical experience with GitHub Projects, GitHub Flow, GitHub Copilot, GitHub Actions, CI/CD pipelines, and Infrastructure as Code, giving you a solid foundation to continue your DevOps learning journey.

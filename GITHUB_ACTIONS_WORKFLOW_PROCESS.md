# GitHub Actions Workflow Process

## Overview
This document describes a **two-stage** CI/CD pipeline for deploying our TypeScript API to **Google Cloud Run** using GitHub Actions. The approach breaks down the deployment process into manageable stages for better control and testing.

---

## STAGE 1: Docker & Code Quality Pipeline

This stage focuses on ensuring code quality, running tests, and building a Docker image for the application. It's designed to run frequently to catch issues early.

### 1. Trigger Conditions

- **On every push to main branch**: Ensures continuous validation of the main codebase
- **On every pull request**: Provides immediate feedback on proposed changes before merging
- **On push to any branch**: Allows developers to test their changes in the CI/CD pipeline before creating a pull request

### 2. Code Quality & Testing Stage

- **Environment Setup**: Sets up a Node.js environment (version 18 or latest LTS) to ensure consistent execution
- **Dependency Installation**: Installs project dependencies using `npm ci` for clean and reproducible builds
- **Code Quality Checks**: Runs ESLint to enforce coding standards and identify potential issues
- **TypeScript Compilation**: Performs TypeScript compilation checks to ensure type safety and catch compilation errors
- **Automated Testing**: Executes Jest unit tests to verify individual components
- **Integration Tests**: Runs any defined integration tests to ensure different parts of the application work together correctly
- **Failure Condition**: The pipeline will fail if any code quality checks or tests do not pass, preventing faulty code from proceeding

### 3. Docker Build & Test Stage

- **Docker Image Build**: Builds the Docker image for the application, ensuring it's containerized correctly
- **Docker Container Testing**: Runs the built Docker container locally within the GitHub Actions environment
- **Health Checks**: Executes basic health checks or smoke tests against the running container to verify its functionality
- **GitHub Container Registry (GHCR) Integration**: Pushes the successfully built and tested Docker image to the GitHub Container Registry, making it available for subsequent deployment stages
- **Security Scanning**: Performs security scans (e.g., using Trivy, Snyk, or CodeQL) on the Docker image to identify vulnerabilities
- **Failure Condition**: The pipeline will fail if the Docker build, container tests, or security scans encounter critical issues

---

## STAGE 2: Google Cloud Run Deployment Pipeline

This stage handles the actual deployment to Google Cloud Run and is designed to run only after Stage 1 has completed successfully.

### 1. Trigger Conditions

- **Only run on successful completion of Stage 1**: Ensures that only validated and tested code reaches the deployment stage
- **Run on push to main branch**: Triggers production deployment for the main codebase
- **Run on push to staging branch**: Allows for staging environment deployments for testing
- **Manual trigger option**: Provides the ability to manually trigger deployments when needed

### 2. Google Cloud Setup & Authentication

- **Google Cloud Authentication**: Authenticates with Google Cloud using service account credentials stored in GitHub Secrets
- **Project Configuration**: Sets up the target Google Cloud project and region for deployment
- **Service Account Setup**: Configures the necessary service account with appropriate permissions for Cloud Run deployment

### 3. Container Registry & Image Management

- **Pull from GHCR**: Retrieves the Docker image that was built and tested in Stage 1
- **Push to Google Container Registry (GCR)**: Pushes the image to Google's container registry for Cloud Run deployment
- **Image Tagging**: Applies appropriate tags for versioning and environment identification
- **Image Security**: Ensures the image meets Google Cloud security requirements

### 4. Google Cloud Run Deployment

- **Service Configuration**: Configures the Cloud Run service with appropriate settings (CPU, memory, concurrency, etc.)
- **Environment Variables**: Sets up necessary environment variables for the deployed service
- **Traffic Management**: Manages traffic routing and canary deployments if configured
- **Health Check Configuration**: Sets up health checks for the deployed service
- **Scaling Configuration**: Configures auto-scaling parameters based on traffic

### 5. Post-Deployment Verification

- **Service Health Checks**: Verifies that the deployed service is running and responding correctly
- **API Endpoint Testing**: Tests critical API endpoints to ensure functionality
- **Performance Monitoring**: Sets up basic monitoring and alerting for the deployed service
- **Rollback Capability**: Maintains the ability to quickly rollback to previous versions if issues are detected

### 6. Notification & Reporting

- **Deployment Status Notifications**: Sends notifications about deployment success or failure
- **Integration with Monitoring Tools**: Connects with monitoring and logging services
- **Deployment Logs**: Provides comprehensive logs for troubleshooting and auditing

---

## Implementation Benefits

### Stage 1 Benefits
- **Early Issue Detection**: Catches problems before they reach production
- **Consistent Code Quality**: Enforces coding standards across the team
- **Fast Feedback Loop**: Provides immediate feedback to developers
- **Container Validation**: Ensures Docker images work correctly before deployment

### Stage 2 Benefits
- **Controlled Deployment**: Only deploys validated and tested code
- **Environment Consistency**: Ensures consistent deployment across environments
- **Automated Rollback**: Provides quick recovery from deployment issues
- **Comprehensive Monitoring**: Sets up proper monitoring and alerting

### Overall Pipeline Benefits
- **Reduced Manual Errors**: Automates the entire deployment process
- **Improved Reliability**: Multiple validation stages ensure higher quality deployments
- **Better Team Collaboration**: Clear separation of concerns between testing and deployment
- **Scalable Process**: Can be easily extended for additional environments or services

---

## Security Considerations

### Stage 1 Security
- **Code Scanning**: Automated security scanning of source code
- **Dependency Scanning**: Checks for vulnerable dependencies
- **Container Security**: Scans Docker images for vulnerabilities
- **Secret Management**: Proper handling of sensitive information

### Stage 2 Security
- **Service Account Security**: Minimal required permissions for deployment
- **Network Security**: Proper network configuration for Cloud Run
- **Environment Isolation**: Separate environments for different deployment stages
- **Audit Logging**: Comprehensive logging of all deployment activities

---

## Monitoring & Observability

### Metrics to Track
- **Build Success Rate**: Percentage of successful builds in Stage 1
- **Test Coverage**: Code coverage metrics from automated tests
- **Deployment Success Rate**: Percentage of successful deployments in Stage 2
- **Service Health**: Uptime and performance metrics of deployed services
- **Security Scan Results**: Number and severity of security issues found

### Alerting
- **Build Failures**: Immediate alerts for failed builds or tests
- **Deployment Failures**: Alerts for failed deployments
- **Service Downtime**: Alerts for service unavailability
- **Security Issues**: Alerts for critical security vulnerabilities

---

## Best Practices

### Development Workflow
1. **Feature Branches**: Develop features in separate branches
2. **Pull Requests**: Always use pull requests for code review
3. **Automated Testing**: Ensure all tests pass before merging
4. **Code Review**: Mandatory code review for all changes

### Deployment Strategy
1. **Staging First**: Always deploy to staging before production
2. **Gradual Rollout**: Use canary deployments for critical changes
3. **Monitoring**: Monitor deployments closely for the first few minutes
4. **Rollback Plan**: Always have a rollback plan ready

### Maintenance
1. **Regular Updates**: Keep dependencies and tools updated
2. **Security Patches**: Apply security patches promptly
3. **Performance Monitoring**: Regular performance reviews
4. **Documentation**: Keep documentation up to date

---

## Conclusion

This two-stage GitHub Actions pipeline provides a robust, secure, and scalable approach to deploying TypeScript APIs to Google Cloud Run. By separating code quality and testing from deployment, teams can ensure high-quality releases while maintaining efficient development workflows.

The pipeline is designed to be:
- **Reliable**: Multiple validation stages prevent faulty deployments
- **Secure**: Comprehensive security scanning and proper secret management
- **Scalable**: Easy to extend for additional services or environments
- **Maintainable**: Clear separation of concerns and comprehensive documentation


# Stage 1: Build the React frontend
FROM node:22-alpine AS frontend-build
WORKDIR /frontend
COPY dairytrack-frontend/package*.json ./
RUN npm ci
COPY dairytrack-frontend/ ./
RUN npm run build

# Stage 2: Build the Spring Boot backend
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /backend
COPY dairytrack/pom.xml ./
COPY dairytrack/.mvn/ .mvn/
COPY dairytrack/mvnw ./
COPY dairytrack/src/ src/
COPY --from=frontend-build /frontend/dist/ src/main/resources/static/
RUN mvn -B -DskipTests package

# Stage 3: Run the application
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend-build /backend/target/*.jar app.jar
EXPOSE 8081
ENV PORT=8081
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8081} -jar /app/app.jar"]
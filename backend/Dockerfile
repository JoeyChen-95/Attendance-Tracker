# Use the official Node.js 14 as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/backend

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle backend source code inside the Docker image
COPY . .

# Make port 8080 available outside this container
EXPOSE 8080

# Run the backend when the container launches
CMD ["node", "server.js"]

# Use a multi-stage build to create the final Docker image
# Stage 1: Build the React application
FROM node:20 AS build

# Set the working directory in the container
WORKDIR /usr/src/frontend

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle frontend source code inside the Docker image
COPY . .

# Build the React application
RUN npm run build

# Stage 2: Serve the React application from Nginx
FROM nginx:alpine

# Copy the build output from the previous stage
COPY --from=build /usr/src/frontend/build /usr/share/nginx/html

# Copy the custom Nginx config file
COPY default.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the outside
EXPOSE 80

# Use the default command of the Nginx image to start the server
CMD ["nginx", "-g", "daemon off;"]

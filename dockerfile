FROM nginx:alpine

# Copy your HTML, CSS, and image files into the container
COPY src/index.html /usr/share/nginx/html/
COPY src/style.css /usr/share/nginx/html/
COPY img/ /usr/share/nginx/html/img/

# Expose port 80 to make the website accessible
EXPOSE 80

# Start the web server
CMD ["nginx", "-g", "daemon off;"]

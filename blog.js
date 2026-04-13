document.addEventListener('DOMContentLoaded', () => {
    const blogContainer = document.getElementById('blog-container');
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        loadPost(postId);
    } else {
        loadPostList();
    }

    function loadPostList() {
        fetch('posts/posts.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Não foi possível carregar os posts');
                }
                return response.json();
            })
            .then(posts => {
                let html = '<h1>Blog</h1>';
                
                if (posts.length === 0) {
                    html += '<p>Nenhum post encontrado.</p>';
                } else {
                    posts.forEach(post => {
                        html += `
                            <div class="blog-post-item">
                                <h2><a href="blog.html?id=${post.id}">${post.title}</a></h2>
                                <p class="date"><i class="fa-regular fa-calendar"></i> ${post.date}</p>
                                <p class="description">${post.description}</p>
                            </div>
                        `;
                    });
                }
                
                blogContainer.innerHTML = html;
            })
            .catch(error => {
                blogContainer.innerHTML = '<h1>Blog</h1><p>Erro ao carregar os posts.</p>';
                console.error(error);
            });
    }

    function loadPost(id) {
        blogContainer.innerHTML = '<p>Carregando post...</p>';

        fetch('posts/posts.json')
            .then(response => response.json())
            .then(posts => {
                const postInfo = posts.find(p => p.id === id);
                
                if (!postInfo) {
                    blogContainer.innerHTML = `
                        <a href="blog.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Voltar</a>
                        <h1>Post não encontrado</h1>`;
                    return;
                }

                fetch(`posts/${postInfo.file}`)
                    .then(response => {
                        if (!response.ok) throw new Error('Markdown não encontrado');
                        return response.text();
                    })
                    .then(markdown => {
                        const htmlContent = marked.parse(markdown);
                        blogContainer.innerHTML = `
                            <a href="blog.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Voltar</a>
                            <div class="blog-post-content">
                                ${htmlContent}
                            </div>
                        `;
                    })
                    .catch(error => {
                        blogContainer.innerHTML = `
                            <a href="blog.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Voltar</a>
                            <h1>Erro ao carregar o conteúdo do post</h1>`;
                        console.error(error);
                    });
            })
            .catch(error => {
                blogContainer.innerHTML = `
                    <a href="blog.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Voltar</a>
                    <h1>Erro ao carregar o índice do blog</h1>`;
                console.error(error);
            });
    }
});

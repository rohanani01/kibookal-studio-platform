/* Browser-compatible — attaches to window. No bundler required.
   Usage in HTML:
     <script src="src/services/apiClient.js"></script>
     <script src="src/services/projectService.js"></script>
     <script>
       window.KIBOOKAL_PROJECTS.list().then(console.log);
     </script>
*/
(function (root) {
  const api = root.KIBOOKAL_API;
  if (!api) {
    console.warn('[projectService] KIBOOKAL_API not loaded — include apiClient.js first');
    return;
  }
  root.KIBOOKAL_PROJECTS = {
    list:   ()       => api.get('/projects'),
    create: (data)   => api.post('/projects', data),
    get:    (id)     => api.get(`/projects/${id}`),
    update: (id, p)  => api.patch(`/projects/${id}`, p)
  };
})(typeof window !== 'undefined' ? window : globalThis);

import { useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5118/api";
const API_PUBLIC_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
});

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [, setRefreshToken] = useState(
    localStorage.getItem("refreshToken") || ""
  );

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const [showRegister, setShowRegister] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "admin@demo.com",
    password: "Admin123!",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const [editingId, setEditingId] = useState(null);

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    role: "user",
  });

  const [profileForm, setProfileForm] = useState({
    email: user?.email || "",
    name: user?.name || "",
    role: user?.role || "user",
  });
  const [selectedUserAvatarFile, setSelectedUserAvatarFile] = useState(null);
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);

  const getAuthConfig = (accessToken = token) => ({
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const getAvatarSrc = (avatarUrl) => {
  if (!avatarUrl) return "";
  if (avatarUrl.startsWith("http")) return avatarUrl;

  return `${API_PUBLIC_URL}${avatarUrl}`;
};

const updateCurrentUserSession = (updatedUser) => {
  localStorage.setItem("user", JSON.stringify(updatedUser));
  setUser(updatedUser);

  setProfileForm({
    email: updatedUser.email,
    name: updatedUser.name,
    role: updatedUser.role,
  });
};
const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  setToken("");
  setRefreshToken("");
  setUser(null);
  setUsers([]);
  setSelectedUser(null);
  setEditingId(null);
  setSelectedUserAvatarFile(null);
  setProfileAvatarFile(null);
};

  const getFriendlyError = (err) => {
    if (!err.response) {
      if (err.message === "Tu sesión expiró. Inicia sesión nuevamente.") {
        return err.message;
      }

      return "No se pudo conectar con el backend. Verifica que dotnet run esté ejecutándose.";
    }

    if (err.response.data?.message) {
      return err.response.data.message;
    }

    if (err.response.data?.errors) {
      const errors = err.response.data.errors;
      const firstKey = Object.keys(errors)[0];

      if (firstKey && errors[firstKey]?.length > 0) {
        return errors[firstKey][0];
      }
    }

    if (err.response.status === 401) {
      return "Tu sesión expiró o el token no es válido. Inicia sesión nuevamente.";
    }

    if (err.response.status === 403) {
      return "No tienes permisos para realizar esta acción.";
    }

    if (err.response.status === 409) {
      return "El email ya existe. Usa otro correo.";
    }

    if (err.response.status === 400) {
      return "Datos inválidos. Revisa los campos e intenta nuevamente.";
    }

    return "Ocurrió un error inesperado. Intenta nuevamente.";
  };

  const refreshAccessToken = async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");

    if (!storedRefreshToken) {
      throw new Error("No hay refresh token disponible.");
    }

    const response = await api.post("/Auth/refresh", {
      refreshToken: storedRefreshToken,
    });

    const newAccessToken = response.data.accessToken;
    const newRefreshToken = response.data.refreshToken;
    const updatedUser = response.data.user;

    localStorage.setItem("token", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    setToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUser(updatedUser);

    return newAccessToken;
  };

  const authenticatedRequest = async (requestFn) => {
    try {
      return await requestFn(token);
    } catch (err) {
      if (err.response?.status === 401) {
        try {
          const newAccessToken = await refreshAccessToken();
          return await requestFn(newAccessToken);
        } catch {
          clearSession();
          throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
        }
      }

      throw err;
    }
  };

  const uploadAvatar = async (userId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return await authenticatedRequest((accessToken) =>
    api.post(`/Users/${userId}/avatar`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  );
};
  const login = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/Auth/login", loginForm);

      localStorage.setItem("token", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setToken(response.data.accessToken);
      setRefreshToken(response.data.refreshToken);
      setUser(response.data.user);

      setProfileForm({
        email: response.data.user.email,
        name: response.data.user.name,
        role: response.data.user.role,
      });

      setMessage("Login correcto");
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const register = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await api.post("/Auth/register", registerForm);

      setMessage("Registro correcto. Ahora puedes iniciar sesión.");
      setShowRegister(false);

      setLoginForm({
        email: registerForm.email,
        password: registerForm.password,
      });

      setRegisterForm({
        name: "",
        email: "",
        password: "",
      });
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");

    try {
      if (storedRefreshToken) {
        await api.post("/Auth/logout", {
          refreshToken: storedRefreshToken,
        });
      }
    } catch {
      // Aunque falle en backend, limpiamos la sesión local.
    } finally {
      clearSession();
      setMessage("Sesión cerrada");
      setError("");
    }
  };

  const loadUsers = async ({ pageValue = page, showSuccess = true } = {}) => {
    setError("");
    setLoading(true);

    try {
      const response = await authenticatedRequest((accessToken) =>
        api.get("/Users", {
          params: {
            page: pageValue,
            size,
            search,
            sortBy,
            sortDir,
          },
          ...getAuthConfig(accessToken),
        })
      );

      setUsers(response.data.data);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
      setPage(response.data.page);

      if (showSuccess) {
        setMessage("Usuarios cargados correctamente");
      }
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await loadUsers({ pageValue: 1 });
  };

  const clearSearch = async () => {
    setSearch("");
    setPage(1);
    setError("");
    setLoading(true);

    try {
      const response = await authenticatedRequest((accessToken) =>
        api.get("/Users", {
          params: {
            page: 1,
            size,
            search: "",
            sortBy,
            sortDir,
          },
          ...getAuthConfig(accessToken),
        })
      );

      setUsers(response.data.data);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
      setPage(response.data.page);
      setMessage("Búsqueda limpiada");
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const viewUser = async (id) => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await authenticatedRequest((accessToken) =>
        api.get(`/Users/${id}`, getAuthConfig(accessToken))
      );

      setSelectedUser(response.data);
      setMessage("Usuario cargado correctamente");
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const saveUser = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (editingId) {
        await authenticatedRequest((accessToken) =>
          api.put(
            `/Users/${editingId}`,
            {
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
              isActive: true,
            },
            getAuthConfig(accessToken)
          )
        );

        setMessage("Usuario actualizado correctamente");
      } else {
        await authenticatedRequest((accessToken) =>
          api.post("/Users", newUser, getAuthConfig(accessToken))
        );

        setMessage("Usuario creado correctamente");
      }

      setNewUser({
        email: "",
        password: "",
        name: "",
        role: "user",
      });

      setEditingId(null);
      setSelectedUser(null);

      await loadUsers({ showSuccess: false });
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setSelectedUser(null);

    setNewUser({
      email: item.email,
      password: "",
      name: item.name,
      role: item.role,
    });

    setMessage(`Editando usuario: ${item.email}`);
  };

  const cancelEdit = () => {
    setEditingId(null);

    setNewUser({
      email: "",
      password: "",
      name: "",
      role: "user",
    });

    setMessage("Edición cancelada");
  };

  const toggleUserStatus = async (item) => {
    const newStatus = !item.isActive;

    const confirmed = window.confirm(
      `¿Seguro que quieres ${newStatus ? "activar" : "desactivar"} a ${
        item.email
      }?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      await authenticatedRequest((accessToken) =>
        api.put(
          `/Users/${item.id}`,
          {
            email: item.email,
            name: item.name,
            role: item.role,
            isActive: newStatus,
          },
          getAuthConfig(accessToken)
        )
      );

      setMessage(
        newStatus
          ? "Usuario activado correctamente"
          : "Usuario desactivado correctamente"
      );

      await loadUsers({ showSuccess: false });
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    const confirmDelete = window.confirm(
      "¿Seguro que quieres eliminar este usuario?"
    );

    if (!confirmDelete) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      await authenticatedRequest((accessToken) =>
        api.delete(`/Users/${id}`, getAuthConfig(accessToken))
      );

      setMessage("Usuario eliminado correctamente");
      setSelectedUser(null);

      await loadUsers({ showSuccess: false });
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await authenticatedRequest((accessToken) =>
        api.put(
          `/Users/${user.id}`,
          {
            email: profileForm.email,
            name: profileForm.name,
            role: user.role,
            isActive: user.isActive ?? true,
          },
          getAuthConfig(accessToken)
        )
      );

      const updatedUser =
        response.data && response.data.id
          ? response.data
          : {
              ...user,
              email: profileForm.email,
              name: profileForm.name,
            };

      updateCurrentUserSession(updatedUser);
      setMessage("Perfil actualizado correctamente");
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };
const uploadSelectedUserAvatar = async (e) => {
  e.preventDefault();

  if (!selectedUser || !selectedUserAvatarFile) {
    setError("Selecciona una imagen para subir.");
    return;
  }

  setError("");
  setMessage("");
  setLoading(true);

  try {
    const response = await uploadAvatar(selectedUser.id, selectedUserAvatarFile);

    setSelectedUser(response.data);
    setSelectedUserAvatarFile(null);

    if (user?.id === response.data.id) {
      updateCurrentUserSession(response.data);
    }

    await loadUsers({ showSuccess: false });

    setMessage("Avatar actualizado correctamente");
  } catch (err) {
    setError(getFriendlyError(err));
  } finally {
    setLoading(false);
  }
};

const uploadProfileAvatar = async (e) => {
  e.preventDefault();

  if (!user?.id || !profileAvatarFile) {
    setError("Selecciona una imagen para subir.");
    return;
  }

  setError("");
  setMessage("");
  setLoading(true);

  try {
    const response = await uploadAvatar(user.id, profileAvatarFile);

    updateCurrentUserSession(response.data);
    setProfileAvatarFile(null);

    setMessage("Avatar actualizado correctamente");
  } catch (err) {
    setError(getFriendlyError(err));
  } finally {
    setLoading(false);
  }
};
  const goToPreviousPage = async () => {
    if (page <= 1) return;
    await loadUsers({ pageValue: page - 1 });
  };

  const goToNextPage = async () => {
    if (page >= totalPages) return;
    await loadUsers({ pageValue: page + 1 });
  };

  return (
    <main className="container">
      <section className={token ? "card appCard" : "card loginCard"}>
      <header className="heroHeader">
      <div className="logoMark"></div>
      <h1>Gestión de usuarios</h1>
      <p>
    
    </p>
  </header>

        {loading && (
          <div className="info" aria-live="polite">
            Cargando...
          </div>
        )}

        {message && (
          <div className="success" aria-live="polite">
            {message}
          </div>
        )}

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        {!token ? (
          <>
            {!showRegister ? (
              <form onSubmit={login}>
                <h2>Login</h2>

                <label htmlFor="loginEmail">Email</label>
                <input
                  id="loginEmail"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, email: e.target.value })
                  }
                  required
                />

                <label htmlFor="loginPassword">Contraseña</label>
                <input
                  id="loginPassword"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  required
                />

                <button type="submit" disabled={loading}>
                  Entrar
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setError("");
                    setMessage("");
                    setShowRegister(true);
                  }}
                >
                  Ir a registro
                </button>
              </form>
            ) : (
              <form onSubmit={register}>
                <h2>Registro</h2>

                <label htmlFor="registerName">Nombre</label>
                <input
                  id="registerName"
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      name: e.target.value,
                    })
                  }
                  required
                />

                <label htmlFor="registerEmail">Email</label>
                <input
                  id="registerEmail"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      email: e.target.value,
                    })
                  }
                  required
                />

                <label htmlFor="registerPassword">Contraseña</label>
                <input
                  id="registerPassword"
                  type="password"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      password: e.target.value,
                    })
                  }
                  required
                />

                <button type="submit" disabled={loading}>
                  Registrarme
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setError("");
                    setMessage("");
                    setShowRegister(false);
                  }}
                >
                  Volver al login
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            <div className="session">
              <p>
                Sesión iniciada como <strong>{user?.email}</strong> — rol{" "}
                <strong>{user?.role}</strong>
              </p>

              <button type="button" onClick={logout}>
                Cerrar sesión
              </button>
            </div>

            {user?.role === "admin" ? (
              <>
                <div className="toolbar">
                  <button
                    type="button"
                    onClick={() => loadUsers()}
                    disabled={loading}
                  >
                    Cargar usuarios
                  </button>
                </div>

                <form onSubmit={handleSearch} className="formBox">
                  <h2>Buscar y ordenar usuarios</h2>

                  <label htmlFor="search">Buscar por nombre o email</label>
                  <input
                    id="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ej: admin, demo, paula..."
                  />

                  <label htmlFor="sortBy">Ordenar por</label>
                  <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="createdAt">Fecha de creación</option>
                    <option value="name">Nombre</option>
                    <option value="email">Email</option>
                    <option value="role">Rol</option>
                    <option value="isActive">Estado</option>
                  </select>

                  <label htmlFor="sortDir">Dirección</label>
                  <select
                    id="sortDir"
                    value={sortDir}
                    onChange={(e) => setSortDir(e.target.value)}
                  >
                    <option value="desc">Descendente</option>
                    <option value="asc">Ascendente</option>
                  </select>

                  <button type="submit" disabled={loading}>
                    Aplicar búsqueda/orden
                  </button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={clearSearch}
                    disabled={loading}
                  >
                    Limpiar búsqueda
                  </button>
                </form>

                <form onSubmit={saveUser} className="formBox">
                  <h2>{editingId ? "Editar usuario" : "Crear usuario"}</h2>

                  <label htmlFor="userName">Nombre</label>
                  <input
                    id="userName"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    required
                  />

                  <label htmlFor="userEmail">Email</label>
                  <input
                    id="userEmail"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    required
                  />

                  {!editingId && (
                    <>
                      <label htmlFor="userPassword">Contraseña</label>
                      <input
                        id="userPassword"
                        type="password"
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                    </>
                  )}

                  <label htmlFor="userRole">Rol</label>
                  <select
                    id="userRole"
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>

                  <button type="submit" disabled={loading}>
                    {editingId ? "Guardar cambios" : "Crear usuario"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={cancelEdit}
                    >
                      Cancelar edición
                    </button>
                  )}
                </form>

                <h2>Usuarios</h2>

                <p>
                  Total: <strong>{total}</strong> usuario(s)
                </p>

                <div className="tableWrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.email}</td>
                          <td>{item.role}</td>
                          <td>{item.isActive ? "Activo" : "Inactivo"}</td>
                          <td>
                            <div className="actions">
                              <button
                                type="button"
                                onClick={() => viewUser(item.id)}
                              >
                                Ver
                              </button>

                              <button
                                type="button"
                                onClick={() => startEdit(item)}
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                className={
                                  item.isActive ? "warning" : "successButton"
                                }
                                onClick={() => toggleUserStatus(item)}
                              >
                                {item.isActive ? "Desactivar" : "Activar"}
                              </button>

                              <button
                                type="button"
                                className="danger"
                                onClick={() => deleteUser(item.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {users.length === 0 && (
                        <tr>
                          <td colSpan="5">No hay usuarios cargados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pagination">
                  <button
                    type="button"
                    className="secondary"
                    disabled={page <= 1 || loading}
                    onClick={goToPreviousPage}
                  >
                    Anterior
                  </button>

                  <span>
                    Página {page} de {totalPages}
                  </span>

                  <button
                    type="button"
                    className="secondary"
                    disabled={page >= totalPages || loading}
                    onClick={goToNextPage}
                  >
                    Siguiente
                  </button>
                </div>

                {selectedUser && (
               <div className="info">
               <h2>Detalle del usuario</h2>

                 {selectedUser.avatarUrl && (
               <img
               className="avatarPreview"
              src={getAvatarSrc(selectedUser.avatarUrl)}
              alt={`Avatar de ${selectedUser.name}`}
              />
               )}
                    <p>
                      <strong>ID:</strong> {selectedUser.id}
                    </p>
                    <p>
                      <strong>Nombre:</strong> {selectedUser.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedUser.email}
                    </p>
                    <p>
                      <strong>Rol:</strong> {selectedUser.role}
                    </p>
                    <p>
                      <strong>Estado:</strong>{" "}
                      {selectedUser.isActive ? "Activo" : "Inactivo"}
                    </p>
                    <form onSubmit={uploadSelectedUserAvatar} className="avatarForm">
                    <label htmlFor="selectedUserAvatar">
                    Subir avatar JPG, PNG o WEBP, máximo 2 MB
                   </label>

                   <input
                    id="selectedUserAvatar"
                 type="file"
                accept="image/jpeg,image/png,image/webp"
               onChange={(e) =>
                 setSelectedUserAvatarFile(e.target.files?.[0] || null)
                }
                 />

                 <button type="submit" disabled={loading || !selectedUserAvatarFile}>
               Subir avatar
              </button>
            </form>
                  </div>
                )}
              </>
            ) : (
              <div className="info">
             <h2>Mi perfil</h2>

              {user?.avatarUrl && (
               <img
               className="avatarPreview"
                src={getAvatarSrc(user.avatarUrl)}
                 alt={`Avatar de ${user.name}`}
               />
                 )}

                <p>
                  Como usuario normal puedes ver y editar solo tu propio perfil.
                </p>

                <form onSubmit={updateProfile}>
                  <label htmlFor="profileName">Nombre</label>
                  <input
                    id="profileName"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        name: e.target.value,
                      })
                    }
                    required
                  />

                  <label htmlFor="profileEmail">Email</label>
                  <input
                    id="profileEmail"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        email: e.target.value,
                      })
                    }
                    required
                  />

                  <button type="submit" disabled={loading}>
                    Actualizar perfil
                  </button>
                </form>
                <form onSubmit={uploadProfileAvatar} className="avatarForm">
               <label htmlFor="profileAvatar">
               Subir avatar JPG, PNG o WEBP, máximo 2 MB
             </label>

            <input
             id="profileAvatar"
          type="file"
            accept="image/jpeg,image/png,image/webp"
           onChange={(e) => setProfileAvatarFile(e.target.files?.[0] || null)}
           />

          <button type="submit" disabled={loading || !profileAvatarFile}>
           Subir avatar
           </button>
        </form>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default App;
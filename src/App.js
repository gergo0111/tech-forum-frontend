import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // Bootstrap JS import
import "./App.css";
 
const API_URL = "http://localhost:3000"; // Backend elérési útvonala
 
const App = () => {
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Összes");
 
  useEffect(() => {
    fetchCategories();
    fetchQuestions();
  }, []);
 
  useEffect(() => {
    fetchQuestions(selectedCategory);
  }, [selectedCategory]);
 
  const addQuestion = async (title, body, category) => {
    if (!user) {
      alert("Be kell jelentkezned, hogy kérdést tegyél fel!");
      return;
    }
 
    try {
      const response = await fetch(`${API_URL}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, category, username: user.username }),
      });
 
      if (!response.ok) throw new Error("Hiba a kérdés beküldésekor");
 
      fetchQuestions(); // Frissíti a kérdések listáját
    } catch (error) {
      console.error("Hiba a kérdés beküldésekor:", error);
    }
  };
 
 
 
 
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      if (!response.ok) throw new Error("Hiba a kategóriák betöltésekor");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };
 
  const fetchQuestions = async (category = "Összes") => {
    try {
      let url = `${API_URL}/questions`;
      if (category !== "Összes") {
        url += `?category=${encodeURIComponent(category)}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Hiba a kérdések betöltésekor");
      const data = await response.json();
     
      console.log("Betöltött kérdések:", data); // 🔍 Debug log
     
      setQuestions(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error(error);
    }
  };
 
 
  return (
    <Router>
      <div className="container mt-3">
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-3">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/" onClick={() => setSelectedCategory('Összes')}>Tech Fórum</Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <Link className="nav-link" to="/" onClick={() => setSelectedCategory('Összes')}>Főoldal</Link>
                </li>
                <li className="nav-item dropdown">
                  <button className="nav-link dropdown-toggle" id="navbarDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    Kategóriák
                  </button>
                  <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                    <li><Link to={'/'} className="nav-link"><button className="dropdown-item" onClick={() => setSelectedCategory("Összes")}>Összes</button></Link></li>
                    {categories.map((category) => (
                      <li><Link to={`/category/${encodeURIComponent(category.name)}`} key={category.id} className="nav-link"><button className="dropdown-item" onClick={() => setSelectedCategory(category.name)}>{category.name}</button></Link></li>
                    ))}
                  </ul>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/new-question">Új kérdés</Link>
                </li>
                {user?.isAdmin ? (
                  <li className="nav-item">
                    <Link className="nav-link" to="/admin">Admin</Link>
                  </li>
                ) : null}
                <li className="nav-item">
                  {!user ? (
                    <Link className="nav-link" to="/auth">Bejelentkezés / Regisztráció</Link>
                  ) : (
                    <button className="btn btn-outline-light nav-link" onClick={() => setUser(null)}>Kijelentkezés</button>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Home questions={questions} user={user} />} />
          <Route path="/category/:category" element={<CategoryPage user={user} />} />
          <Route path="/new-question" element={<NewQuestion addQuestion={addQuestion} categories={categories} questions={questions} />} />
          <Route path="/auth" element={<Auth setUser={setUser} />} />
          <Route path="/admin" element={user?.isAdmin ? <AdminPanel user={user} /> : <Home questions={questions} user={user} />} />
        </Routes>
      </div>
    </Router>
  );
};
 
const Home = ({ questions, user }) => (
  <div>
    <h3>Legfrissebb kérdések</h3>
    {questions.length > 0 ? (
      questions.map((q) => (
        <div className="card p-3 mt-3 shadow-sm" key={q.id}>
          <h5>{q.title}</h5>
          <p>{q.body}</p>
          <small className="text-muted">
            {q.username} -{" "}
            <Link to={`/category/${encodeURIComponent(q.category)}`} className="text-primary">
              {q.category}
            </Link>{" "}
            - {new Date(q.created_at).toLocaleString()}
          </small>
         
          {/* Komment szekció */}
          <CommentSection questionId={q.id} user={user} />
        </div>
      ))
    ) : (
      <p>Nincsenek kérdések.</p>
    )}
  </div>
);
 
const CategoryPage = ({ questions, user }) => {
  const { category } = useParams();
  const [filteredQuestions, setFilteredQuestions] = useState([]);
 
  useEffect(() => {
    const fetchCategoryQuestions = async () => {
      try {
        const response = await fetch(`${API_URL}/questions?category=${encodeURIComponent(category)}`);
        if (!response.ok) throw new Error("Hiba a kérdések betöltésekor");
        const data = await response.json();
        setFilteredQuestions(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch (error) {
        console.error(error);
      }
    };
 
    fetchCategoryQuestions();
  }, [category]);
 
  return (
    <div>
      <h3>{category} kérdések</h3>
      {filteredQuestions.length > 0 ? (
        filteredQuestions.map((q) => (
          <div className="card p-3 mt-3 shadow-sm" key={q.id}>
            <h5>{q.title}</h5>
            <p>{q.body}</p>
            <small className="text-muted">
              {q.username} -{" "}
              <Link to={`/category/${encodeURIComponent(q.category)}`} className="text-primary">
                {q.category}
              </Link>{" "}
              - {new Date(q.created_at).toLocaleString()}
            </small>
 
            {/* Komment szekció */}
            <CommentSection questionId={q.id} user={user} />
          </div>
        ))
      ) : (
        <p>Nincsenek kérdések ebben a kategóriában.</p>
      )}
    </div>
  );
};
 
 
 
const NewQuestion = ({ addQuestion, categories, questions }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
 
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !body || !category) {
      alert("Minden mezőt ki kell tölteni!");
      return;
    }
    if (typeof addQuestion !== "function") {
      console.error("❌ Az addQuestion nem egy függvény!");
      return;
    }
    addQuestion(title, body, category);
    setTitle("");
    setBody("");
    setCategory("");
  };
 
 
 
  return (
    <div>
      <h3>Új kérdés beküldése</h3>
      <form onSubmit={handleSubmit} className="mb-4">
        <input type="text" className="form-control my-2" placeholder="Cím" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="form-control my-2" placeholder="Kérdés részletei" value={body} onChange={(e) => setBody(e.target.value)} required></textarea>
        <select className="form-select my-2" value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">Válassz kategóriát</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
        <button className="btn btn-success w-100">Kérdés beküldése</button>
      </form>
      <h4>Legfrissebb kérdések</h4>
      {(questions ?? []).slice(0, 3).map(q => (
        <div className="card p-3 mt-2 shadow-sm" key={q.id}>
          <h5>{q.title}</h5>
          <p>{q.body}</p>
          <small className="text-muted">{q.username} - {q.category} - {new Date(q.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
};
 
const Auth = ({ setUser }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
 
  const handleAuth = async () => {
    const endpoint = isRegister ? "/register" : "/login";
    const payload = isRegister ? { username, password, email } : { username, password };
 
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
     
      if (response.ok) {
        if (!isRegister) {
          setUser(data.user);
          navigate("/"); // Sikeres bejelentkezés után visszavisz a főoldalra
        } else {
          alert("✅ Sikeres regisztráció! Most jelentkezz be.");
          setIsRegister(false);
        }
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Hiba:", error);
    }
  };
 
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleAuth();
    }
  };
 
  return (
    <div className="auth-container">
      <h3>{isRegister ? "Regisztráció" : "Bejelentkezés"}</h3>
      <input
        type="text"
        placeholder="Felhasználónév"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <input
        type="password"
        placeholder="Jelszó"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {isRegister && (
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      )}
      <button onClick={handleAuth}>{isRegister ? "Regisztráció" : "Bejelentkezés"}</button>
      <p onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Már van fiókod? Jelentkezz be!" : "Még nincs fiókod? Regisztrálj!"}
      </p>
    </div>
  );
};
 
 
 
const organizeComments = (comments) => {
  const commentMap = {};
  comments.forEach(c => {
      c.replies = [];
      commentMap[c.id] = c;
  });
  comments.forEach(c => {
      if (c.parent_id) {
          commentMap[c.parent_id]?.replies.push(c);
      }
  });
  return comments.filter(c => !c.parent_id);
};
 
const CommentSection = ({ questionId, user }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [showComments, setShowComments] = useState(false);
 
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/questions/${questionId}/comments`);
      if (!response.ok) throw new Error("Hiba a kommentek betöltésekor");
      const data = await response.json();
      setComments(organizeComments(data)); // Kommentek hierarchikus elrendezése
    } catch (error) {
      console.error(error);
    }
  }, [questionId]);
 
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [fetchComments, showComments]);
 
  const addComment = async () => {
    if (!user) {
      alert("Be kell jelentkezned, hogy hozzászólhass!");
      return;
    }
    if (!commentText.trim()) {
      alert("A komment nem lehet üres!");
      return;
    }
 
    try {
      const response = await fetch(`${API_URL}/questions/${questionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText, username: user.username, parentId: replyTo })
      });
      if (!response.ok) throw new Error("Hiba a komment beküldésekor");
 
      setCommentText("");
      setReplyTo(null);
      fetchComments();
    } catch (error) {
      console.error(error);
    }
  };
 
  return (
    <div className="comment-section">
      <button className="btn btn-secondary btn-sm" onClick={() => setShowComments(!showComments)}>
        {showComments ? "Hozzászólások elrejtése" : "Hozzászólások megjelenítése"}
      </button>
 
      {showComments && (
        <div className="mt-2">
          <h6>Hozzászólások</h6>
          {comments.length > 0 ? (
            comments.map((c, index) => (
              <div key={index} className="comment-container">
                <strong>{c.username}</strong>: {c.text}
                <div className="comment-actions">
                  <button onClick={() => setReplyTo(c.id)}>Válasz</button>
                </div>
 
                {c.replies.length && (
                  <div className="mt-2">
                    {c.replies.map((reply, idx) => (
                      <div key={idx} className="comment-reply">
                        <strong>{reply.username}</strong>: {reply.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>Még nincsenek hozzászólások.</p>
          )}
 
          {user ? (
            <>
              {replyTo && (
                <p className="text-muted">Válaszolás erre: <strong>{comments.find(c => c.id === replyTo)?.text}</strong></p>
              )}
              <textarea
                className="comment-box"
                placeholder="Írd le a véleményed..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button className="btn-comment" onClick={addComment}>Hozzászólás</button>
              {replyTo && (
                <button className="btn btn-secondary btn-sm ms-2" onClick={() => setReplyTo(null)}>Mégse</button>
              )}
            </>
          ) : (
            <p className="text-muted">Jelentkezz be a hozzászóláshoz.</p>
          )}
        </div>
      )}
    </div>
  );
};
 
const AdminPanel = ({ user }) => {
  const [users, setUsers] = useState([]);
 
  useEffect(() => {
    fetchUsers();
  }, []);
 
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      if (!response.ok) throw new Error("Hiba a felhasználók betöltésekor");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };
 
  const deleteUser = async (id) => {
    if (user.id === id) {
      alert("Nem törölheted saját magad!");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Hiba a felhasználó törlésekor!");
      fetchUsers(); // Frissítés
    } catch (error) {
      console.error("Hiba a törléskor:", error);
    }
  };
 
  const grantAdmin = async (id) => {
    try {
      const response = await fetch(`${API_URL}/users/${id}/make-admin`, { method: "POST" });
      if (!response.ok) throw new Error("Hiba az admin jogok adásakor!");
      fetchUsers(); // Frissítés
    } catch (error) {
      console.error("Hiba az admin jogok adásakor:", error);
    }
  };
  const revokeAdmin = async (id) => {
    if (user.id === id) {
      alert("Nem veheted el saját magadtól az admin jogot!");
      return;
    }
    try {
      await fetch(`${API_URL}/users/${id}/remove-admin`, { method: "POST" });
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };
 
  return (
    <div>
      <h3>Felhasználók kezelése</h3>
      <ul className="list-group">
        {users.map(u => (
          <li key={u.id} className="list-group-item d-flex justify-content-between align-items-center">
            {u.username} {u.isAdmin ? "(Admin)" : null}
            <div>
              {!u.isAdmin ? (
                <button className="btn btn-sm btn-warning me-2" onClick={() => grantAdmin(u.id)}>Admin jog</button>
              ) : (
                <button className="btn btn-sm btn-secondary me-2" onClick={() => revokeAdmin(u.id)}>Admin jog visszavonása</button>
              )}
              {u.id !== user.id && <button className="btn btn-sm btn-danger" onClick={() => deleteUser(u.id)}>Törlés</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
 
};
 
export default App;
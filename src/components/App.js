import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import './../styles/App.css';

export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async () => {
    const response = await axios.get('https://api.nytimes.com/svc/books/v3/lists/current/hardcover-fiction.json?api-key=orXJ6bA7n5bL3Pq9Z2w8X1v4T6m3Y5k8');
    // Map NYT API results structure to title, author, publisher, isbn
    const booksData = response.data.results.books.map((book) => ({
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      isbn: book.primary_isbn13 || book.isbn13 || 'N/A'
    }));
    return booksData;
  }
);

const booksSlice = createSlice({
  name: 'books',
  initialState: {
    books: [],
    status: 'idle',
    error: null,
    sortBy: 'title',
    order: 'asc'
  },
  reducers: {
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setOrder: (state, action) => {
      state.order = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.books = action.payload;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

const { setSortBy, setOrder } = booksSlice.actions;

const store = configureStore({
  reducer: {
    books: booksSlice.reducer
  }
});

function BooksList() {
  const dispatch = useDispatch();
  const { books, status, error, sortBy, order } = useSelector((state) => state.books);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchBooks());
    }
  }, [status, dispatch]);

  const handleSortByChange = (e) => {
    dispatch(setSortBy(e.target.value));
  };

  const handleOrderChange = (e) => {
    dispatch(setOrder(e.target.value));
  };

  const sortedBooks = [...books].sort((a, b) => {
    let valA = a[sortBy] ? a[sortBy].toLowerCase() : '';
    let valB = b[sortBy] ? b[sortBy].toLowerCase() : '';

    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="books-list-container" style={{ padding: '20px' }}>
      <h2>Book Sorting App</h2>
      
      <div className="sorting-controls" style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
        <div>
          <label>Sort By: </label>
          <select value={sortBy} onChange={handleSortByChange}>
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="publisher">Publisher</option>
          </select>
        </div>

        <div>
          <label>Order: </label>
          <select value={order} onChange={handleOrderChange}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {status === 'loading' && <p>Loading books...</p>}
      {status === 'failed' && <p>Error: {error}</p>}

      {status === 'succeeded' && (
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Publisher</th>
              <th>ISBN</th>
            </tr>
          </thead>
          <tbody>
            {sortedBooks.map((book, index) => (
              <tr key={index}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.publisher}</td>
                <td>{book.isbn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div id="main">
          <Routes>
            <Route path="/" element={<BooksList />} />
          </Routes>
        </div>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

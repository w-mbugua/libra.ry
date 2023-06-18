import axios from 'axios';
import { BookDetails } from '../types';

export async function searchBooksByTitle(
  title: string,
  author: string
): Promise<{ book: BookDetails; error: string | undefined }> {
  const encodedTitle = encodeURIComponent(title);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedTitle}`;
  const response = await axios.get(url);
  let book;
  let error;
  if (response.status === 200 && response.data.items) {
    const books = response.data.items.filter(
      (item: any) => item.volumeInfo.imageLinks && item.volumeInfo.description
    );

    console.log(books);

    if (books.length) {
      const found = books.find((book: any) => {
        console.log(book.volumeInfo.authors);

        return book.volumeInfo.authors.some(
          (a: string) => a.toLowerCase() === author.toLowerCase()
        );
      });
      if (!found) {
        error = 'book not found';
      }
      book = found || books[0];
    }
  }
  return { book, error };
}

export function truncateDescription(description: string, lines: number = 3) {
  const allLines = description.split('.').slice(0, lines);
  return allLines.join('. ') + '.';
}

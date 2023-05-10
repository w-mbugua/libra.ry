import axios from 'axios';
import { BookDetails } from '../types';

export async function searchBooksByTitle(
  title: string
): Promise<BookDetails> {
  const encodedTitle = encodeURIComponent(title);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedTitle}`;
  const response = await axios.get(url);
  let book;
  if (response.status === 200 && response.data.items) {
    book = response.data.items.find((item: any) => item.volumeInfo.imageLinks && item.volumeInfo.description);
  }
  return book;
}

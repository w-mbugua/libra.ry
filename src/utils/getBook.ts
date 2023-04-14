import axios from "axios";
import { BookDetails } from "../types";

export async function searchBooksByTitle(title: string): Promise<BookDetails[]> {
  const encodedTitle = encodeURIComponent(title);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedTitle}`;
  const response = await axios.get(url);
  return response.data.items;
}

// // Example usage:
// searchBooksByTitle('The Great Gatsby')
//   .then((books) => {
//     console.log(books[0]);
//   })
//   .catch((err) => {
//     console.error(err);
//   });

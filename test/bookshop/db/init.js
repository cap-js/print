// Dummy method to populate an actual PDF file into each book record
// In a real app, you would e.g. generate a PDF based on book data
// or print a PDF that is connected to the book (e.g. a report that
// is stored in a document management system)

module.exports = async function () {
  const path = require("path");
  const fs = require("fs");

  // Load the template PDF file
  const pdfPath = path.join(__dirname, "../files", "Summary.pdf");
  const templatePDF = fs.readFileSync(pdfPath);

  console.log(`📄 Template PDF loaded: ${templatePDF.length} bytes`);

  const newBooks = [
    {
      ID: 201,
      title: "Wuthering Heights",
      descr:
        "Wuthering Heights, Emily Brontë's only novel, was published in 1847 under the pseudonym \"Ellis Bell\". It was written between October 1845 and June 1846. Wuthering Heights and Anne Brontë's Agnes Grey were accepted by publisher Thomas Newby before the success of their sister Charlotte's novel Jane Eyre. After Emily's death, Charlotte edited the manuscript of Wuthering Heights and arranged for the edited version to be published as a posthumous second edition in 1850.",
      author_ID: 101,
      stock: 12,
      price: 11.11,
      currency_code: "GBP",
      genre_ID: 11,
    },
    {
      ID: 207,
      title: "Jane Eyre",
      descr:
        "Jane Eyre /ɛər/ (originally published as Jane Eyre: An Autobiography) is a novel by English writer Charlotte Brontë, published under the pen name \"Currer Bell\", on 16 October 1847, by Smith, Elder & Co. of London. The first American edition was published the following year by Harper & Brothers of New York. Primarily a bildungsroman, Jane Eyre follows the experiences of its eponymous heroine, including her growth to adulthood and her love for Mr. Rochester, the brooding master of Thornfield Hall. The novel revolutionised prose fiction in that the focus on Jane's moral and spiritual development is told through an intimate, first-person narrative, where actions and events are coloured by a psychological intensity. The book contains elements of social criticism, with a strong sense of Christian morality at its core and is considered by many to be ahead of its time because of Jane's individualistic character and how the novel approaches the topics of class, sexuality, religion and feminism.",
      author_ID: 107,
      stock: 11,
      price: 12.34,
      currency_code: "GBP",
      genre_ID: 11,
    },
    {
      ID: 251,
      title: "The Raven",
      descr:
        '"The Raven" is a narrative poem by American writer Edgar Allan Poe. First published in January 1845, the poem is often noted for its musicality, stylized language, and supernatural atmosphere. It tells of a talking raven\'s mysterious visit to a distraught lover, tracing the man\'s slow fall into madness. The lover, often identified as being a student, is lamenting the loss of his love, Lenore. Sitting on a bust of Pallas, the raven seems to further distress the protagonist with its constant repetition of the word "Nevermore". The poem makes use of folk, mythological, religious, and classical references.',
      author_ID: 150,
      stock: 333,
      price: 13.13,
      currency_code: "USD",
      genre_ID: 16,
    },
    {
      ID: 252,
      title: "Eleonora",
      descr:
        '"Eleonora" is a short story by Edgar Allan Poe, first published in 1842 in Philadelphia in the literary annual The Gift. It is often regarded as somewhat autobiographical and has a relatively "happy" ending.',
      author_ID: 150,
      stock: 555,
      price: 14,
      currency_code: "USD",
      genre_ID: 16,
    },
    {
      ID: 271,
      title: "Catweazle",
      descr:
        "Catweazle is a British fantasy television series, starring Geoffrey Bayldon in the title role, and created by Richard Carpenter for London Weekend Television. The first series, produced and directed by Quentin Lawrence, was screened in the UK on ITV in 1970. The second series, directed by David Reid and David Lane, was shown in 1971. Each series had thirteen episodes, most but not all written by Carpenter, who also published two books based on the scripts.",
      author_ID: 170,
      stock: 22,
      price: 150,
      currency_code: "JPY",
      genre_ID: 13,
    },
  ];

  const insertPromises = newBooks.map((book) => {
    return [
      INSERT.into("Books")
        .entries({
          ...book,
          file: templatePDF,
          file2: templatePDF,
          fileName: `Book_${book.ID}_Summary`,
          fileName2: `Book_${book.ID}_Summary2`,
        })
        .then(() => {
          console.log(`Inserted book ${book.ID}: ${book.title}`);
        }),
      INSERT.into("BooksWithOneFile")
        .entries({
          ...book,
          file: templatePDF,
          fileName: `Book_${book.ID}_Summary`,
        })
        .then(() => {
          console.log(`Inserted book ${book.ID}: ${book.title}`);
        }),
    ];
  });

  insertPromises.push(
    INSERT.into("CompositeKeys").entries({
      ID: 1,
      ID2: 2,
      file: templatePDF,
      fileName: `Book_Composite_Summary`,
      file2: templatePDF,
      fileName2: `Book_Composite_Summary_2`,
    }),
  );

  await Promise.all(insertPromises);
};

const cds = require("@sap/cds");

module.exports = class CatalogService extends cds.ApplicationService {
  async init() {
    const { Books } = cds.entities("sap.capire.bookshop");
    const { ListOfBooks } = this.entities;

    // Connect to print service once during initialization
    const printer = await cds.connect.to("PrintService");

    // Print action handler - print the stored PDF for this book
    this.on("printBookFileManualImpl", "Books", async (req) => {
      // Get the book with its stored PDF file - explicitly include file field
      // This is not automatically included in queries because it's a BLOB

      if (!req.data.qnameID || !req.data.copies)
        return req.error(400, "Please provide qnameID and copies in the request body");

      const book = await SELECT.one.from(req.subject).columns(["ID", "title", "fileName", "file"]);

      if (!book) {
        return req.error(404, "Book not found");
      }

      // Check if the book has a PDF file
      if (!book.file) {
        return req.error(400, "No PDF file found for this book");
      }

      const streamToBase64 = async (stream) => {
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks).toString("base64");
      };

      try {
        // Send the book's PDF to the print service
        await printer.send("print", {
          qname: req.data.qnameID,
          numberOfCopies: req.data.copies,
          docsToPrint: [
            {
              fileName: book.fileName,
              content: await streamToBase64(book.file),
              isMainDocument: true,
            },
          ],
        });

        // Success message to user
        req.info(`Book "${book.title}" PDF (${book.fileName}) sent to printer successfully`);
      } catch (error) {
        console.error("Print error:", error);
        req.error(500, `Failed to print PDF: ${error.message}`);
      }
    });

    // Add some discount for overstocked books
    this.after("each", ListOfBooks, (book) => {
      if (book.stock > 111) book.title += ` -- 11% discount!`;
    });

    // Reduce stock of ordered books if available stock suffices
    this.on("submitOrder", async (req) => {
      let { book: id, quantity } = req.data;
      let book = await SELECT.one.from(Books, id, (b) => b.stock);

      // Validate input data
      if (!book) return req.error(404, `Book #${id} doesn't exist`);
      if (quantity < 1) return req.error(400, `quantity has to be 1 or more`);
      if (!book.stock || quantity > book.stock)
        return req.error(409, `${quantity} exceeds stock for book #${id}`);

      // Reduce stock in database and return updated stock value
      await UPDATE(Books, id).with({ stock: (book.stock -= quantity) });
      return book;
    });

    // Emit event when an order has been submitted
    this.after("submitOrder", async (_, req) => {
      let { book, quantity } = req.data;
      await this.emit("OrderedBook", { book, quantity, buyer: req.user.id });
    });

    // Delegate requests to the underlying generic service
    return super.init();
  }
};

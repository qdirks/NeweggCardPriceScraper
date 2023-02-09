
(function() {
    /** @param {HTMLElement} page */
    function scrapePage(page) {
        const gpuArray = [];
        /** @type {HTMLDivElement[]} */
        let itemCells = [].slice.call(page.querySelectorAll("div#app div.item-cell"));
        itemCells.forEach(item=>{
            const gpu = {};
            const info = item.querySelector(".item-info");
            const branding = info.querySelector(".item-branding");
            const img = branding.querySelector("img");
            const title = info.querySelector(".item-title");
            if (img) {
                gpu.brand = img.getAttribute("title").toUpperCase();
                gpu.imgSrc = img.src;
            }
            else gpu.brand = title.childNodes[1].textContent.split(" ")[0].toUpperCase();
            const rating = branding.querySelector(".item-rating");
            if (rating) {
                gpu.rating = Number(rating.querySelector("i").getAttribute("aria-label").split(" ")[1]);
                gpu.numReviews = Number(rating.querySelector("span").textContent.replace("(", "").replace(")", ""));
            }
            const condition = title.childNodes[0].textContent;
            gpu.condition = condition ? condition.trim() : "new";
            gpu.name = title.childNodes[1].textContent;
            const price = item.querySelector(".item-action .price .price-current");
            const strong = price.querySelector("strong");
            const sup = price.querySelector("sup");
            let characteristic, mantissa;
            if (strong) {
                characteristic = strong.textContent.replaceAll(",", "");
                mantissa = sup.textContent;
                gpu.price = Number(characteristic + mantissa);
            }
            const promo = info.querySelector(".item-promo");
            gpu.inStock = true;
            if (promo && promo.textContent.indexOf("OUT OF STOCK") > -1) gpu.inStock = false;
            gpuArray.push(gpu);
        });
        return gpuArray;
    }
    function stringToHTML(str){
        const parser = new DOMParser();
        const doc = parser.parseFromString(str, 'text/html');
        return doc;
    }
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    let search = window.location.search;
    let Nparam = '';
    let currentPage = 1;
    let pageSize = '';
    search.slice(1).split("&").forEach(qp=>{
        const [key, value] = qp.split("=");
        if (key === 'page') currentPage = Number(value);
        else if (key === 'PageSize') pageSize = value;
        else if (key === 'N') Nparam = value;
    });
    const url = origin + pathname + "?N=" + Nparam + "&PageSize=" + pageSize + "&page=";
    const numPages = Number(document.querySelector(".list-tool-pagination-text").textContent.split('/')[1]);
    const gpuArray = [];
    const scrapeFn = function() {
        let cp = currentPage;
        let done = false;
        console.log("fetching:", url + currentPage);
        fetch(url + currentPage)
        .then(resp=>resp.text())
        .then(text=>{
            console.log("page fetched:", cp);
            gpuArray.push(...scrapePage(stringToHTML(text)));
            if (done) {
                console.log(gpuArray);
                fileSaver("gpu-information.json", JSON.stringify(gpuArray, undefined, 4));
            }
        });
        currentPage++;
        if (!(currentPage < numPages + 1)) {
            done = true;
            return clearInterval(si);
        }
    };
    const si = setInterval(scrapeFn, 3 * 1_000);
    if (currentPage <= numPages) scrapeFn();
    else clearInterval(si);
    /**
     * 
     * @param {string} fileName 
     * @param {string} content
     */
    function fileSaver(fileName, content) {
        var fi = new File([content], fileName);
        var dlink = document.createElement('a');
        dlink.href = URL.createObjectURL(fi);
        dlink.setAttribute('download', fi.name);
        dlink.click();
    }
})();

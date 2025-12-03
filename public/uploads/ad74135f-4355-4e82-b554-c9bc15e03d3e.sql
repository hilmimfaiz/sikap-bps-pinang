-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 01, 2025 at 04:26 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_store`
--

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `id` int(11) NOT NULL,
  `name` varchar(40) NOT NULL,
  `price` double NOT NULL,
  `promo` double NOT NULL,
  `description` varchar(300) NOT NULL,
  `image` varchar(160) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`id`, `name`, `price`, `promo`, `description`, `image`) VALUES
(1, 'SAMSUNG Galaxy A16 5G', 3999000, 3399000, 'Chipset : Octa-Core (2.4GHz, 2GHz) , Kamera Belakang : 50MP + 5MP + 2MP, Kamera Depan : 13 MP, Ukuran Layar : 6.7 inch , Baterai : 5000 mAh', 'https://assets.bmdstatic.com/web/image?model=product.product&field=image_1024&id=298081&unique=3b4c3ec'),
(2, 'SAMSUNG Galaxy Tab A9 WiF', 1899000, 0, 'Processor: Mediatek MT8781V/CA Helio G99 (6nm), Kamera Belakang: 8 MP , Kamera Depan: 2 MP , Ukuran Layar: 8.7 Inch WUXGA, Baterai: 5100 mAh , Jaringan: Wifi Only, Sistem Operasi: Android 13', 'https://assets.bmdstatic.com/web/image?model=product.product&field=image_1024&id=87517&unique=6c086b8'),
(3, 'AKARI 32 Inch HD Digital TV LE-32D53', 2999000, 1649000, 'Ukuran layar : 32 inch , Resolusi : 1366 x 768 ,\r\nChannel : Digital , Konsumsi daya : 42 Watt', 'https://assets.bmdstatic.com/web/image?model=product.product&field=image_1024&id=296987&unique=b5193da'),
(4, 'XIAOMI TV A Pro 32 MITV L32M8-A2ID', 2079000, 1999000, 'Ukuran: 32 inch , Resolusi: 1366 × 768 ,\r\nProcessor: CPU: CA55 × 4; GPU: Mali G31 MP2 ,\r\nKonektivitas: HDMI; USB; Bluetooth 5.0; , Wi-Fi 2.4GHz/5GH', 'https://assets.bmdstatic.com/web/image?model=product.product&field=image_1024&id=127880&unique=52184bc'),
(5, 'SHARP Microwave Oven R-220MA-WH', 1000000, 809000, 'Microwave Oven, Oven Capacity: 20 liter, Turn Table Diameter: 255mm , 5 Power Levels, 8 Auto Programmes , Handle and Glass Door, Kitchen Timer', 'https://assets.bmdstatic.com/web/image?model=product.product&field=image_1024&id=68779&unique=ecf485c'),
(6, 'MITO Oven Listrik Mini Wood Series 11 Li', 599000, 419000, 'Oven Listrik , Kapasitas: 11 Liter , Pengaturan suhu : 100 ° - 250° C , Pengaturan waktu: 60 menit dengan ring bell , Diamond shape alumunium cavity', 'https://assets.bmdstatic.com/web/image?model=product.product&field=image_1024&id=70836&unique=e98648a'),
(7, 'EPSON EcoTank L3210', 2418000, 2199000, 'Printer Type: Print/Scan/Copy , Print Speed : Up to 33.0 ppm (Black)/ 15.0 ppm (Color) , Maximum Paper Size: 215.9 x 1200 mm , Printing Maximum Resolution: 5760 x 1440 dpi', 'https://assets.bmdstatic.com/web/image?model=product.product&field=image_1024&id=62749&unique=4df3c63'),
(8, 'HP Printer Laser 108a 4ZB79A', 1898000, 1825000, 'Print Technology: Laser , Print speed up to 21 ppm (black) , Duty Cycle (Monthly; A4): Up to 10.000 pages , Connectivity: Hi-Speed USB 2.0 port ', 'https://assets.bmdstatic.com/web/image?model=product.product&field=image_1024&id=290355&unique=1ba80b4'),
(9, 'ADATA Ultimate 1TB SU800 M.2 SSD', 2270500, 2039000, 'Solid State Drive Internal , Capacity : 1TB , Sequential Read : 560 MB/s; Sequential Write 520 MB/s , Form Factor : M.2 2280', 'https://assets.bmdstatic.com/web/image?model=product.product&field=image_1024&id=81334&unique=4a99718'),
(10, 'WD Blue SSD SATA 1TB WDS100T2B0A', 2170000, 1399000, 'Solid state drive , Capacity: 1TB , Interface: SATA 6Gb/s , Form factor: 2.5\" / 7 mm', 'https://assets.bmdstatic.com/web/image?model=product.product&field=image_1024&id=15834&unique=dd458e1');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

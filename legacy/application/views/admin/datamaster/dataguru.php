<!-- [ Main Content ] start -->
<div class="pcoded-main-container">
    <div class="pcoded-content">
        <!-- [ breadcrumb ] start -->
        <div class="page-header">
            <div class="page-block">
                <div class="row align-items-center">
                    <div class="col-md-12">
                        <div class="page-header-title">
                            <h5 class="m-b-10">Data Guru</h5>
                        </div>
                        <ul class="breadcrumb">
                            <li class="breadcrumb-item"><a href="index.html"><i class="feather icon-home"></i></a></li>
                            <li class="breadcrumb-item"><a href="#!">Sekolah</a></li>
                            <li class="breadcrumb-item"><a href="#!">Data Guru</a></li>
                        </ul>
                    </div>
                </div>        
            </div>
        </div>


        <!-- [ breadcrumb ] end -->
        <!-- [ Main Content ] start -->
        <div class="row">
            <!-- subscribe start -->
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                     
                        <button class="btn btn-sm btn-round has-ripple" style="background-color: #48336F; color: #ffffff;" data-toggle="modal" data-target="#modal-import"><i class="feather icon-upload"></i> Import Guru</button>
                        <button class="btn btn-sm btn-round has-ripple" style="background-color: #0f52ba; color: #ffffff;" data-toggle="modal" data-target="#modal-report"><i class="feather icon-plus"></i> Tambah Guru</button>
                        <a href="<?php echo base_url() ?>master/download_templateguru" class="btn btn-sm btn-round has-ripple" style="background-color: #02304A; color: #ffffff;"><i class="fa fa-download"></i> Download Template</a>
                        <a href="<?php echo base_url() ?>master/hapussemuaguru" class="btn btn-sm btn-round has-ripple" style="background-color: #FF0000; color: #ffffff;"><i class="fa fa-download"></i>Kosongkan Guru</a>
                

                        <?php if($this->session->flashdata('hapus_berhasil')){ ?>  
                            <div class="col-xl-6 alert alert-danger">  
                              <a href="#" class="close" data-dismiss="alert">&times;</a>  
                              <strong></strong> <?php echo $this->session->flashdata('hapus_berhasil'); ?>  
                            </div>  
                          <?php } ?>  

                          <?php if($this->session->flashdata('tambah_berhasil')){ ?>  
                            <div class="col-xl-6 alert alert-info">  
                              <a href="#" class="close" data-dismiss="alert">&times;</a>  
                              <strong></strong> <?php echo $this->session->flashdata('tambah_berhasil'); ?>  
                            </div>  
                          <?php } ?>  

                          <?php if($this->session->flashdata('import_berhasil')){ ?>  
                            <div class="col-xl-6 alert alert-info">  
                              <a href="#" class="close" data-dismiss="alert">&times;</a>  
                              <strong>Proses Selesai </strong> <?php echo $this->session->flashdata('import_berhasil'); ?>  
                            </div>  
                          <?php } ?>  
                    </div>

                    <div class="card-body">
                        <div class="row align-items-center m-l-0">
                            <div class="col-sm-6">
                            </div>
                            
                        </div>
                       
                        <div class="table-responsive">
                            <table id="report-table" class="table table-bordered table-striped mb-0">
                                <thead>
                                    <tr class="text-center">
                                        <th>No</th>
                                        <th>Nama</th>
                                        <th>Pangkat Dan Golongan</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody><?php $no = 1; foreach($dataguru as $res){ ?>
                                    <tr>
                                        <td class="text-center"><?php echo $no++ ?></td>
                                        <td>
                                        <div class="d-inline-block align-middle">
                                        <div class="card-body">
                                        <img style="width:75px;75px;" src="<?php echo base_url(); ?>upload/fotoguru/<?php echo $res->foto_guru; ?>" class="img-responsive img-thumbnail" />
                                            <div class="d-inline-block">
                                                <h6 class="m-b-0"><?php echo $res->nama_guru ?></h6>
                                                <p class="m-b-0">NIP.<?php echo $res->nip ?></p>
                                            </div>
                                        </div>
                                        </td>
                                        <td>
                                        <div class="d-inline-block align-middle">
                                        <div class="card-body">
                                            <p></p>
                                            <div class="d-inline-block">
                                                <h6 class="m-b-0"><?php echo $res->status_guru ?> - <?php echo $res->golongan ?></h6>
                                                <p class="m-b-0">Guru Mapel : <?php echo $res->namamapel ?></p>
                                            </div>
                                        </div>
                                        </td>
                                        <td class="text-center">
                                            <a onClick="getDataPendidikan(<?php echo $res->id_guru ?>)" href="#" data-toggle="modal" data-target="#modal-report2<?php echo $res->id_guru ?>" class="btn btn-icon btn-info btn-sm" style="background-color: #01605A; color: #ffffff;"><i class="feather icon-edit"></i></a>
                                            <a href="<?php echo base_url() ?>master/hapusguru/<?php echo $res->id_guru ?>" class="btn btn-icon btn-sm tombol-hapus" style="background-color: #FF0000; color: #ffffff;"><i class="feather icon-trash-2"></i></a>
                                        </td>
                                    </tr>



                                    <div class="modal fade" id="modal-report2<?php echo $res->id_guru ?>" tabindex="-1" role="dialog" aria-labelledby="myExtraLargeModalLabel"aria-hidden="true">
                                        <div class="modal-dialog modal-lg">
                                            <div class="modal-content">
                                                <div class="modal-header">
                                                    <h5 class="modal-title">Edit Data Guru</h5>
                                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                        <span aria-hidden="true">&times;</span>
                                                    </button>
                                                </div>
                                                <div class="modal-body">
                                                    <i class="fa fa-circle-o-notch fa-spin" id="load_scan" aria-hidden="true" style="display:none;"></i>
                                                    <form action="<?php echo base_url() ?>master/updateguru" method="POST">
                                                        <div class="row">

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="nama_guru">Nama</label>
                                                                    <input type="text" class="form-control" name="nama_guru" value="<?php echo $res->nama_guru ?>">
                                                                    <input type="hidden" class="form-control" name="id_guru" value="<?php echo $res->id_guru ?>" >
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="npk">NPK</label>
                                                                    <input type="text" maxlength="15" class="form-control" name="npk" value="<?php echo $res->npk ?>">
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="nuptk">NUPTK</label>
                                                                    <input type="text" maxlength="16" class="form-control" name="nuptk" value="<?php echo $res->nuptk ?>">
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="nik">NIK</label>
                                                                    <input type="text" maxlength="16" class="form-control" name="nik" value="<?php echo $res->nik ?>">
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="nip">NIP</label>
                                                                    <input type="text" class="form-control" name="nip" value="<?php echo $res->nip ?>">
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="notelp">No WA</label>
                                                                    <input type="number" class="form-control" name="notelp" value="<?php echo $res->notelp ?>" placeholder="081111111111">
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="email">Email</label>
                                                                    <input type="text" class="form-control" name="email" value="<?php echo $res->email ?>" placeholder="email@gmail.com">
                                                                </div>
                                                            </div>


                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="jeniskelamin">Jenis Kelamin</label>
                                                                    <select class="form-control" id="jeniskelamin" name="jeniskelamin">
                                                                        <option value="<?php echo $res->jeniskelamin ?>">Pilihan Saat ini <?php echo $res->jeniskelamin ?></option>
                                                                        <option value="L">Laki-Laki</option>
                                                                        <option value="P">Perempuan</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="status_guru">Status</label>
                                                                    <select class="form-control" id="status_guru" name="status_guru">
                                                                        <option value="<?php echo $res->status_guru ?>">Pilihan Saat ini <?php echo $res->status_guru ?></option>
                                                                        <option value="-">KOSONGKAN</option>
                                                                        <option value="ASN">ASN</option>
                                                                        <option value="HONORER">HONORER</option>
                                                                        <option value="P3K">P3K</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="golongan">Pangkat/Golongan</label>
                                                                    <select class="form-control" id="golongan" name="golongan">
                                                                        <option value="<?php echo $res->golongan ?>">Pilihan Saat ini <?php echo $res->golongan ?></option>
                                                                        <option value="-">Tidak Memiliki</option>
                                                                        <option value="II/a">II/a</option>
                                                                        <option value="II/b">II/b</option>
                                                                        <option value="II/c">II/c</option>
                                                                        <option value="II/d">II/d</option>
                                                                        <option value="III/a">III/a</option>
                                                                        <option value="III/b">III/b</option>
                                                                        <option value="III/c">III/c</option>
                                                                        <option value="III/d">III/d</option>
                                                                        <option value="IV/a">IV/a</option>
                                                                        <option value="IV/b">IV/b</option>
                                                                        <option value="IV/c">IV/c</option>
                                                                        <option value="IV/d">IV/d</option>
                                                                        <option value="IV/e">IV/e</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="namamapel">Mengajar Mapel</label>
                                                                    <input type="text" class="form-control" name="namamapel" value="<?php echo $res->namamapel ?>" placeholder="Mengajar Mapel" oninput="this.value = this.value.toUpperCase()">
                                                                </div>
                                                            </div>


                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="tmt">TMT</label>
                                                                    <input type="date" class="form-control" name="tmt" value="<?php echo $res->tmt ?>">
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="tempat_lahir">Tempat Lahir</label>
                                                                    <input type="text" class="form-control" name="tempat_lahir" value="<?php echo $res->tempat_lahir ?>">
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="tahun_lahir">Tahun Lahir</label>
                                                                    <input type="date" class="form-control" name="tahun_lahir" value="<?php echo $res->tahun_lahir ?>">
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="golongan_darah">Golongan Darah</label>
                                                                    <select class="form-control" id="golongan_darah" name="golongan_darah">
                                                                        <option value="<?php echo $res->golongan_darah ?>">Pilihan Saat ini <?php echo $res->golongan_darah ?></option>
                                                                        <option value="Golongan Darah O">Golongan Darah O</option>
                                                                        <option value="Golongan Darah A">Golongan Darah A</option>
                                                                        <option value="Golongan Darah B">Golongan Darah B</option>
                                                                        <option value="Golongan Darah AB">Golongan Darah AB</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="transportasi">Transportasi</label>
                                                                    <select class="form-control" id="transportasi" name="transportasi">
                                                                        <option value="<?php echo $res->transportasi ?>">Pilihan Saat ini <?php echo $res->transportasi ?></option>
                                                                        <option value="Jalan Kaki">Jalan Kaki</option>
                                                                        <option value="Sepeda">Sepeda</option>
                                                                        <option value="Sepeda Motor">Sepeda Motor</option>
                                                                        <option value="Mobil Pribadi">Mobil Pribadi</option>
                                                                        <option value="Antar Jemput sekolah">Antar Jemput sekolah</option>
                                                                        <option value="Angkutan Umum">Angkutan Umum</option>
                                                                        <option value="Lainnya">Lainnya</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="jarak_tempat_tinggal">Jarak Tempat Tinggal</label>
                                                                    <select class="form-control" id="jarak_tempat_tinggal" name="jarak_tempat_tinggal">
                                                                        <option value="<?php echo $res->jarak_tempat_tinggal ?>">Pilihan Saat ini <?php echo $res->jarak_tempat_tinggal ?></option>
                                                                        <option value="<5 Km"><5 Km</option>
                                                                        <option value="5-10 Km">5-10 Km</option>
                                                                        <option value="11-20 Km">11-20 Km</option>
                                                                        <option value="21-30 Km">21-30 Km</option>
                                                                        <option value=">30 Km">>30 Km</option>
                                                                    </select>
                                                                </div>
                                                            </div>


                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="waktu_tempuh">Waktu Tempuh</label>
                                                                    <select class="form-control" id="waktu_tempuh" name="waktu_tempuh">
                                                                        <option value="<?php echo $res->waktu_tempuh ?>">Pilihan Saat ini <?php echo $res->waktu_tempuh ?></option>
                                                                        <option value="1-10 menit">1-10 menit</option>
                                                                        <option value="10-19 menit">10-19 menit</option>
                                                                        <option value="20-29 menit">20-29 menit</option>
                                                                        <option value="30-39 menit">30-39 menit</option>
                                                                        <option value="1-2 jam">1-2 jam</option>
                                                                        <option value="> 2 Jam">> 2 Jam</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-12">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="alamat">Alamat</label>
                                                                    <input type="text" class="form-control" name="alamat" value="<?php echo $res->alamat ?>">
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="nama_ibu_kandung">Nama Ibu Kandung</label>
                                                                    <input type="text" class="form-control" name="nama_ibu_kandung" value="<?php echo $res->nama_ibu_kandung ?>">
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="status_kawin">Status Kawin</label>
                                                                    <select class="form-control" id="status_kawin" name="status_kawin">
                                                                        <option value="<?php echo $res->status_kawin ?>">Pilihan Saat ini <?php echo $res->status_kawin ?></option>
                                                                        <option value="Kawin">Kawin</option>
                                                                        <option value="Belum Kawin">Belum Kawin</option>
                                                                        <option value="Duda/Janda">Duda/Janda</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="nama_suami_istri">Nama Suami/Istri</label>
                                                                    <input type="text" class="form-control" name="nama_suami_istri" value="<?php echo $res->nama_suami_istri ?>">
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="jumlah_anak">Jumlah Anak</label>
                                                                    <input type="text" class="form-control" name="jumlah_anak" value="<?php echo $res->jumlah_anak ?>">
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-12">
                                                                <div class="accordion" id="accordionExample">
                                                                  <div class="card">
                                                                    <div class="card-header" id="headingOne" style="padding: 5px;">
                                                                      <h2 class="mb-0">
                                                                        <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne" style="padding: 5px;font-weight: 600;color: #4b4b4b;">
                                                                          Pendidikan Formal
                                                                        </button>
                                                                      </h2>
                                                                    </div>

                                                                    <div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="#accordionExample">
                                                                      <div class="card-body" style="padding: 10px;">
                                                                        <div id="table_pendidikan_guru_<?php echo $res->id_guru ?>"></div>
                                                                        <!-- <div class="row" style="padding-top:10px;">
                                                                            <div class="col-sm-6">
                                                                                <div class="form-group">
                                                                                    <label class="floating-label" for="pendidikan_terakhir">Pendidikan Terakhir</label>
                                                                                    <input type="text" class="form-control" name="nama_guru" value="<?php echo $res->pendidikan_terakhir ?>" readonly>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-sm-6">
                                                                                <div class="form-group">
                                                                                    <label class="floating-label" for="perguruan_tinggi">Asal Sekolah / Perguruan tinggi</label>
                                                                                    <input type="text" class="form-control" name="perguruan_tinggi" value="<?php echo $res->perguruan_tinggi ?>" readonly>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-sm-6">
                                                                                <div class="form-group">
                                                                                    <label class="floating-label" for="status_perguruan_tinggi">Status Sekolah/Perguruan Tinggi</label>
                                                                                    <input type="text" class="form-control" name="status_perguruan_tinggi" value="<?php echo $res->status_perguruan_tinggi ?>" readonly>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-sm-6">
                                                                                <div class="form-group">
                                                                                    <label class="floating-label" for="alamat_perguruan_tinggi">Alamat Sekolah/Perguruan Tinggi</label>
                                                                                    <input type="text" class="form-control" name="alamat_perguruan_tinggi" value="<?php echo $res->alamat_perguruan_tinggi ?>" readonly>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-sm-6">
                                                                                <div class="form-group">
                                                                                    <label class="floating-label" for="jenis_perguruan_tinggi">Jenis Sekolah/Perguruan Tinggi</label>
                                                                                    <input type="text" class="form-control" name="jenis_perguruan_tinggi" value="<?php echo $res->jenis_perguruan_tinggi ?>" readonly>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-sm-6">
                                                                                <div class="form-group">
                                                                                    <label class="floating-label" for="fakultas">Fakultas</label>
                                                                                    <input type="text" class="form-control" name="fakultas" value="<?php echo $res->fakultas ?>" readonly>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-sm-6">
                                                                                <div class="form-group">
                                                                                    <label class="floating-label" for="jurusan">Status Jurusan</label>
                                                                                    <input type="text" class="form-control" name="jurusan" value="<?php echo $res->jurusan ?>" readonly>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-sm-6">
                                                                                <div class="form-group">
                                                                                    <label class="floating-label" for="gelar">Status Gelar Akademik</label>
                                                                                    <input type="text" class="form-control" name="gelar" value="<?php echo $res->gelar ?>" readonly>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-sm-6">
                                                                                <div class="form-group">
                                                                                    <label class="floating-label" for="tahun_masuk">Tahun Masuk</label>
                                                                                    <input type="text" class="form-control" name="tahun_masuk" value="<?php echo $res->tahun_masuk ?>" readonly>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-sm-6">
                                                                                <div class="form-group">
                                                                                    <label class="floating-label" for="tahun_lulus">Tahun Lulus</label>
                                                                                    <input type="text" class="form-control" name="tahun_lulus" value="<?php echo $res->tahun_lulus ?>" readonly>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-sm-6">
                                                                                <div class="form-group">
                                                                                    <label class="floating-label" for="ipk">IPK</label>
                                                                                    <input type="text" class="form-control" name="ipk" value="<?php echo $res->ipk ?>" readonly>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-sm-6">
                                                                                <div class="form-group">
                                                                                    <label class="floating-label" for="tanggal_izazah">Tanggal Izazah</label>
                                                                                    <input type="text" class="form-control" name="tanggal_izazah" value="<?php echo $res->tanggal_izazah ?>" readonly>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-sm-6">
                                                                                <div class="form-group">
                                                                                    <label class="floating-label" for="nomor_izazah">Nomor Izazah</label>
                                                                                    <input type="text" class="form-control" name="nomor_izazah" value="<?php echo $res->nomor_izazah ?>" readonly>
                                                                                </div>
                                                                            </div>
                                                                            <div class="col-sm-12">
                                                                                <button class="btn btn-primary">Tambah Riwayat Pendidikan + </button>
                                                                            </div>
                                                                        </div> -->
                                                                      </div>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                            </div>





                                                            <div class="col-md-6">
                                                                <div class="form-group">
                                                                    <div class="card card-info">
                                                                    <div class="card-body">
                                                                        <center><img style="width:125px;125px;" src="<?php echo base_url(); ?>upload/fotoguru/<?php echo $res->foto_guru; ?>" class="img-responsive img-thumbnail" /></center>
                                                                    </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div class="col-sm-6">
                                                                <div class="form-group">
                                                                    <label class="floating-label" for="username">Username</label>
                                                                    <input type="text" class="form-control" name="username" value="<?php echo $res->username ?>">
                                                                </div>

                                                                <div class="form-group">
                                                                    <label class="floating-label" for="password">Password</label>
                                                                    <input type="text" class="form-control" name="password" value="<?php echo $res->password ?>">
                                                                </div>
                                                            </div>

                                                       

                                                            <div class="col-sm-12">
                                                                <button class="btn btn-info">Perbaharui</button>
                                                            </div>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                    <?php } ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <!-- subscribe end -->
        </div>
        <!-- [ Main Content ] end -->
    </div>
</div>





<div class="modal fade" id="modal-report" tabindex="-1" role="dialog" aria-labelledby="myExtraLargeModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-md">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Tambah Guru</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form action="<?php echo base_url() ?>master/simpanguru" method="post" enctype="multipart/form-data" role="form">

                    <div class="row">
                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="nama_guru">Nama</label>
                                <input type="text" class="form-control" id="nama_guru" name="nama_guru" placeholder="Nama Guru">
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="npk">NPK</label>
                                <input type="text" maxlength="15" class="form-control" name="npk" placeholder="NPK">
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="nuptk">NUPTK</label>
                                <input type="text" maxlength="16" class="form-control" name="nuptk" placeholder="NUPTK">
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="nik">NIK</label>
                                <input type="text" maxlength="16" class="form-control" name="nik" placeholder="NIK">
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="nip">NIP</label>
                                <input type="text" class="form-control" id="nip" name="nip" placeholder="menjadi username & password">
                                <input type="hidden" name="username" class="form-control" required>
                                <input type="hidden" name="password" class="form-control" required>
                                <input type="hidden" name="role" class="form-control" value="guru" autocomplete="off"  required >
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="notelp">Nomor Telp</label>
                                <input type="number" class="form-control" id="notelp" name="notelp" placeholder="Nomor Telp">
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="email">Email</label>
                                <input type="text" class="form-control" id="email" name="email" placeholder="Email">
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="jeniskelamin">Jenis Kelamin</label>
                                <select class="form-control" id="jeniskelamin" name="jeniskelamin">
                                    <option value="L">Laki-Laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </div>
                        </div>

                                                            

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="status_guru">Status</label>
                                <select class="form-control" id="status_guru" name="status_guru">
                                    <option value="-">KOSONGKAN</option>
                                    <option value="ASN">ASN</option>
                                    <option value="HONORER">HONORER</option>
                                    <option value="P3K">P3K</option>
                                </select>
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="golongan">Pangkat/Golongan</label>
                                <select class="form-control" id="golongan" name="golongan">
                                    <option value="-">Tidak Memiliki</option>
                                    <option value="II/a">II/a</option>
                                    <option value="II/b">II/b</option>
                                    <option value="II/c">II/c</option>
                                    <option value="II/d">II/d</option>
                                    <option value="III/a">III/a</option>
                                    <option value="III/b">III/b</option>
                                    <option value="III/c">III/c</option>
                                    <option value="III/d">III/d</option>
                                    <option value="IV/a">IV/a</option>
                                    <option value="IV/b">IV/b</option>
                                    <option value="IV/c">IV/c</option>
                                    <option value="IV/d">IV/d</option>
                                    <option value="IV/e">IV/e</option>
                                </select>
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="namamapel">Mengajar Mapel</label>
                                <input type="text" class="form-control" name="namamapel" placeholder="Mengajar Mapel" oninput="this.value = this.value.toUpperCase()">
                            </div>
                        </div>


                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="tmt">TMT</label>
                                <input type="date" class="form-control" name="tmt" placeholder="TMT">
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="tempat_lahir">Tempat Lahir</label>
                                <input type="text" class="form-control" name="tempat_lahir" placeholder="Tempat Lahir">
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="tahun_lahir">Tahun Lahir</label>
                                <input type="date" class="form-control" name="tahun_lahir" placeholder="Tahun Lahir">
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="golongan_darah">Golongan Darah</label>
                                <select class="form-control" id="golongan_darah" name="golongan_darah">
                                    <option value="-">KOSONGKAN</option>
                                    <option value="Golongan Darah O">Golongan Darah O</option>
                                    <option value="Golongan Darah A">Golongan Darah A</option>
                                    <option value="Golongan Darah B">Golongan Darah B</option>
                                    <option value="Golongan Darah AB">Golongan Darah AB</option>
                                </select>
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="transportasi">Transportasi</label>
                                <select class="form-control" id="transportasi" name="transportasi">
                                    <option value="-">KOSONGKAN</option>
                                    <option value="Jalan Kaki">Jalan Kaki</option>
                                    <option value="Sepeda">Sepeda</option>
                                    <option value="Sepeda Motor">Sepeda Motor</option>
                                    <option value="Mobil Pribadi">Mobil Pribadi</option>
                                    <option value="Antar Jemput sekolah">Antar Jemput sekolah</option>
                                    <option value="Angkutan Umum">Angkutan Umum</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="jarak_tempat_tinggal">Jarak Tempat Tinggal</label>
                                <select class="form-control" id="jarak_tempat_tinggal" name="jarak_tempat_tinggal">
                                    <option value="-">KOSONGKAN</option>
                                    <option value="<5 Km"><5 Km</option>
                                    <option value="5-10 Km">5-10 Km</option>
                                    <option value="11-20 Km">11-20 Km</option>
                                    <option value="21-30 Km">21-30 Km</option>
                                    <option value=">30 Km">>30 Km</option>
                                </select>
                            </div>
                        </div>


                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="waktu_tempuh">Waktu Tempuh</label>
                                <select class="form-control" id="waktu_tempuh" name="waktu_tempuh">
                                    <option value="-">KOSONGKAN</option>
                                    <option value="1-10 menit">1-10 menit</option>
                                    <option value="10-19 menit">10-19 menit</option>
                                    <option value="20-29 menit">20-29 menit</option>
                                    <option value="30-39 menit">30-39 menit</option>
                                    <option value="1-2 jam">1-2 jam</option>
                                    <option value="> 2 Jam">> 2 Jam</option>
                                </select>
                            </div>
                        </div>

                        <div class="col-sm-12">
                            <div class="form-group">
                                <label class="floating-label" for="alamat">Alamat</label>
                                <input type="text" class="form-control" name="alamat" placeholder="Alamat">
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="nama_ibu_kandung">Nama Ibu Kandung</label>
                                <input type="text" class="form-control" name="nama_ibu_kandung" placeholder="Nama Ibu Kandung">
                           </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="status_kawin">Status Kawin</label>
                                <select class="form-control" id="status_kawin" name="status_kawin">
                                    <option value="-">KOSONGKAN</option>
                                    <option value="Kawin">Kawin</option>
                                    <option value="Belum Kawin">Belum Kawin</option>
                                    <option value="Duda/Janda">Duda/Janda</option>
                                </select>
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="nama_suami_istri">Nama Suami/Istri</label>
                                <input type="text" class="form-control" name="nama_suami_istri" placeholder="Nama Suami/Istri">
                            </div>
                        </div>

                        <div class="col-sm-6">
                            <div class="form-group">
                                <label class="floating-label" for="jumlah_anak">Jumlah Anak</label>
                                <input type="text" class="form-control" name="jumlah_anak" placeholder="Jumlah Anak">
                            </div>
                        </div>


                      

                        <div class="col-sm-12">
                            <button class="btn btn-primary" id="pnotify-success">Simpan</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>




<!-- [ Main Content ] end -->




<div class="modal fade" id="modal-import" tabindex="-1" role="dialog" aria-labelledby="myExtraLargeModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-md">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Import Guru</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form method="POST" action="<?php echo base_url() ?>import/uploadguru" enctype="multipart/form-data">
                    <div class="row">
                        <div class="col-12">
                            <h5>Masukkan Template anda</h5>
                        </div>
                      
                        <div class="col-sm-12">
                            <div class="form-group fill">
                                <input type="file" name="userfile" class="form-control" id="Icon" placeholder="sdf">
                            </div>
                        </div>
                       
                        <div class="col-sm-12">
                            <button class="btn btn-info" id="pnotify-success">Impor Data</button>
                            
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<div class="base_url" hidden><?php echo base_url(); ?></div>
<!-- [ Main Content ] end -->
<script type="text/javascript">
var main_url = document.querySelector('.base_url').innerText;
    
    function getDataPendidikan(id) {
      $.ajax({
        url: main_url+'master/datapendidikanguru/?id='+id,
        type: 'GET',
        contentType: false,
        // async: false,
        processData: false,
        beforeSend: function(x) {
          document.querySelector('#load_scan').style.display = 'inline-block';
        },
        success: function (data) {
          if (data['data']){
            console.log(id);
            var content_pendidikan = '';
            if (data['data'].pendidikan.length > 0){
                data['data'].pendidikan.forEach((content, i) => {
                  var new_no = i+1;
                  content_pendidikan += `<tr>
                      <td>${new_no++}</td>
                      <td>${content.pendidikan_terakhir}</td>
                      <td>${content.perguruan_tinggi}</td>
                      <td>${content.status_perguruan_tinggi}</td>
                      <td>${content.alamat_perguruan_tinggi}</td>
                      <td>${content.jenis_perguruan_tinggi}</td>
                      <td>${content.fakultas}</td>
                      <td>${content.jurusan}</td>
                      <td>${content.gelar}</td>
                      <td>${content.tahun_masuk}</td>
                      <td>${content.tahun_lulus}</td>
                      <td>${content.ipk}</td>
                      <td>${content.tanggal_izazah}</td>
                      <td>${content.nomor_izazah}</td>
                      <td class="text-center" style="position: absolute;width: 8em;right: 12px;top: auto;margin-top: 0px;border: none;background: white;padding: 5px;border: 1px solid #b4b4b4;">
                        <a onClick="getDataPendidikan()" class="btn btn-icon btn-sm" style="background-color: #4680ff; color: #ffffff;"><i class="feather icon-edit"></i></a>
                        <a onClick="getDataPendidikan()" class="btn btn-icon btn-sm" style="background-color: #FF0000; color: #ffffff;"><i class="feather icon-trash-2"></i></a>
                      </td>
                    </tr>`;
                })
            }else{
                content_pendidikan = 'Belum ada data pendidikan';
            }

            var table = `<table id="report-table" class="table table-bordered table-striped mb-0" style="display: inline-block; overflow: auto;">
                            <thead>
                                <tr class="text-center">
                                    <th>No</th>
                                    <th>Pend. terakhir</th>
                                    <th>Asal Sekolah</th>
                                    <th>Status Sekolah</th>
                                    <th>Alamat Sekolah</th>
                                    <th>Jenis Sekolah</th>
                                    <th>Fakultas</th>
                                    <th>Status Jurusan</th>
                                    <th>Status Gelar</th>
                                    <th>Thn Masuk</th>
                                    <th>Thn Lulus</th>
                                    <th>IPK</th>
                                    <th>Tgl Izazah</th>
                                    <th>No. Izazah</th>
                                    <th>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Aksi&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th>
                                </tr>
                            </thead>
                            <tbody>
                                `+content_pendidikan+`
                            </tbody>
                        </table>`;
          }

          document.querySelector('#table_pendidikan_guru_'+id).innerHTML = table;
          document.querySelector('#load_scan').style.display = 'none';
        },
        error: function () {
          alert('failed update data');
            document.querySelector('.loading_face').style.display = 'none';
          }
      });
    }
</script>
